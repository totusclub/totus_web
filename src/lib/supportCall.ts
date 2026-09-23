/**
 * Звонок в поддержку из браузера.
 *
 * Перенос реализации панели оператора `calling_v2/lib/webrtc-service.ts`:
 * та же машина состояний, тот же порядок вызовов (getUserMedia → ICE с бэкенда →
 * RTCPeerConnection → offer → POST /api/calls → ожидание answer по сокету с
 * HTTP-поллингом как запасным путём), та же очередь ICE-кандидатов до
 * установки remoteDescription.
 *
 * Отличия от панели — только те, что продиктованы средой сайта:
 *   1. сокет берётся общий (`@/lib/supportSocket`), а не заводится свой:
 *      к voip.totus.club сайт уже подключён ради чата поддержки, а второе
 *      соединение перетирало бы регистрацию устройства;
 *   2. Bearer — пользовательский `auth_token`, а не agent-JWT панели;
 *   3. выброшены разделы, которых на сайте нет: совместимость с user1/user2 и
 *      диагностика STUN/TURN (страница «Проверить серверы» в панели);
 *   4. добавлено поле `lastError` — сайту нужно показать причину («нет доступа
 *      к микрофону» / «оператор не на линии»), панель показывала alert().
 */
import type { Socket } from 'socket.io-client';
import { connectSupportSocket } from '@/lib/supportSocket';
import { SUPPORT_DISPLAY_NAME, SUPPORT_LOYALTY_ID } from '@/config/support';
import {
    SupportCallError,
    endCallRequest,
    getCall,
    getIceServers,
    registerDevice,
    rejectCallRequest,
    sendAnswer,
    sendCandidate,
    startCall,
} from '@/api/supportCallApi';

export type CallState = 'idle' | 'calling' | 'ringing' | 'answered' | 'ended' | 'rejected';
export type CallErrorKind = 'microphone' | 'offline' | 'unknown';

// --- состояние модуля (как в панели оператора) ---------------------------------
let pc: RTCPeerConnection | null = null;
let localStream: MediaStream | null = null;
let remoteStream: MediaStream | null = null;
let remoteAudio: HTMLAudioElement | null = null;
let activeCallUUID: string | null = null;
let currentLoyaltyId: string | null = null;
let currentDeviceId: string | null = null;
let activeCallStartedAt: number | null = null;
let isInitialized = false;
let socketBound = false;

let currentCallState: CallState = 'idle';
let callerName: string | null = null;
let isMuted = false;
let lastError: CallErrorKind | null = null;

let onCallStateChange: ((state: CallState, name: string | null) => void) | null = null;
let onCallActiveChange: ((isActive: boolean, startedAt: number | null) => void) | null = null;

// Кандидаты, пришедшие до setRemoteDescription — иначе addIceCandidate бросает.
let queuedIceCandidates: Array<{ callId: string; candidate: RTCIceCandidateInit }> = [];

function generateUUID(): string {
    try {
        if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
            return crypto.randomUUID();
        }
    } catch {
        // ignore
    }
    const rnd = () => Math.floor(Math.random() * 0xffffffff).toString(16).padStart(8, '0');
    return `${Date.now().toString(16)}-${rnd()}-${rnd()}`;
}

function setState(state: CallState, name: string | null = callerName): void {
    currentCallState = state;
    callerName = name;
    onCallStateChange?.(state, name);
}

async function processQueuedIceCandidates(callId: string): Promise<void> {
    if (!pc || !pc.remoteDescription) return;
    const rest: typeof queuedIceCandidates = [];
    for (const item of queuedIceCandidates) {
        if (item.callId !== callId) {
            rest.push(item);
            continue;
        }
        try {
            await pc.addIceCandidate(new RTCIceCandidate(item.candidate));
        } catch {
            // кандидат мог быть добавлен ранее — не мешает звонку
        }
    }
    queuedIceCandidates = rest;
}

// --- сокет ---------------------------------------------------------------------

function bindSocket(): Socket | null {
    const socket = connectSupportSocket();
    if (!socket || socketBound) return socket;
    socketBound = true;

    socket.on('connect', () => {
        if (currentDeviceId && currentLoyaltyId) {
            socket.emit('registerDevice', { deviceId: currentDeviceId, loyaltyId: currentLoyaltyId });
        }
    });

    socket.on('call-state', (data: { callId: string; state: string; direction?: string; callerName?: string; fromLoyaltyId?: string }) => {
        const { callId, state, direction } = data;

        if (state === 'ringing' && direction === 'incoming') {
            activeCallUUID = callId;
            setState('ringing', data.callerName || data.fromLoyaltyId || SUPPORT_DISPLAY_NAME);
            return;
        }

        if (state === 'answered') {
            if (activeCallUUID && activeCallUUID !== callId) return;
            if (!activeCallUUID) activeCallUUID = callId;
            if (!activeCallStartedAt) activeCallStartedAt = Date.now();
            setState('answered');
            onCallActiveChange?.(true, activeCallStartedAt);
            return;
        }

        if (state === 'ended' || state === 'rejected') {
            setState(state === 'ended' ? 'ended' : 'rejected');
            teardown({ notifyBackend: false });
        }
    });

    // Входящий звонок: оператор может перезвонить на этот же браузер.
    socket.on('offer', async (data: { callId: string; offer: RTCSessionDescriptionInit; callerName?: string; fromLoyaltyId?: string }) => {
        if (pc && activeCallUUID === data.callId) return;
        activeCallUUID = data.callId;
        setState('ringing', data.callerName || data.fromLoyaltyId || SUPPORT_DISPLAY_NAME);
        try {
            await preparePeer(data.callId, data.offer, 'callee');
        } catch {
            activeCallUUID = null;
            setState('idle', null);
        }
    });

    socket.on('answer', async (data: { callId: string; answer: RTCSessionDescriptionInit }) => {
        if (!pc || activeCallUUID !== data.callId) return;
        await applyRemoteAnswer(data.callId, data.answer);
    });

    socket.on('ice-candidate', async (data: { callId: string; candidate: RTCIceCandidateInit }) => {
        if (!data.candidate) return;
        if (!pc || activeCallUUID !== data.callId) return;
        if (!pc.remoteDescription) {
            queuedIceCandidates.push({ callId: data.callId, candidate: data.candidate });
            return;
        }
        try {
            await pc.addIceCandidate(new RTCIceCandidate(data.candidate));
        } catch {
            // Invalid candidate / уже добавлен — на звонок не влияет
        }
    });

    return socket;
}

/** Применить answer: состояние сигналинга проверяем, как в панели оператора. */
async function applyRemoteAnswer(callId: string, answer: RTCSessionDescriptionInit): Promise<void> {
    if (!pc) return;
    const signalingState = pc.signalingState;

    if (signalingState === 'stable' || signalingState === 'have-remote-pranswer') {
        // answer уже применён другим путём (сокет и HTTP-поллинг работают параллельно)
        await processQueuedIceCandidates(callId);
        if (currentCallState !== 'answered') {
            if (!activeCallStartedAt) activeCallStartedAt = Date.now();
            setState('answered');
            onCallActiveChange?.(true, activeCallStartedAt);
        }
        return;
    }

    if (signalingState !== 'have-local-offer') return;

    try {
        await pc.setRemoteDescription(new RTCSessionDescription(answer));
        await processQueuedIceCandidates(callId);
        if (!activeCallStartedAt) activeCallStartedAt = Date.now();
        setState('answered');
        onCallActiveChange?.(true, activeCallStartedAt);
    } catch {
        // «wrong state» означает, что answer уже стоит — состояние всả равно обновляем
        if (pc.signalingState === 'stable') {
            await processQueuedIceCandidates(callId);
            if (!activeCallStartedAt) activeCallStartedAt = Date.now();
            setState('answered');
            onCallActiveChange?.(true, activeCallStartedAt);
        }
    }
}

// --- WebRTC --------------------------------------------------------------------

const FALLBACK_ICE_SERVERS: RTCIceServer[] = [
    { urls: 'stun:stun1.totus.club:3478' },
    { urls: 'stun:stun2.totus.club:3478' },
];

let cachedIceServers: RTCIceServer[] | null = null;
let cachedIceExpiresAt = 0;

async function fetchIceServers(): Promise<RTCIceServer[]> {
    const now = Math.floor(Date.now() / 1000);
    if (cachedIceServers && now < cachedIceExpiresAt - 300) return cachedIceServers;
    try {
        const data = await getIceServers();
        if (Array.isArray(data.iceServers) && data.iceServers.length > 0) {
            cachedIceServers = data.iceServers;
            cachedIceExpiresAt = Number(data.expiresAt) || now + 3600;
            return cachedIceServers;
        }
    } catch {
        // без TURN звонок возможен, но не во всех сетях
    }
    return cachedIceServers || FALLBACK_ICE_SERVERS;
}

/** Микрофон + peer connection. Параметры RTCPeerConnection — как в панели оператора. */
async function preparePeer(
    callUUID: string,
    remoteOffer: RTCSessionDescriptionInit | null,
    role: 'caller' | 'callee',
): Promise<void> {
    if (pc) teardown({ notifyBackend: false, keepState: true });

    try {
        localStream = await navigator.mediaDevices.getUserMedia({
            audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true },
            video: false,
        });
    } catch {
        lastError = 'microphone';
        throw new Error('microphone');
    }

    const iceServers = await fetchIceServers();
    const peer = new RTCPeerConnection({
        iceServers,
        iceCandidatePoolSize: 10,
        iceTransportPolicy: 'all',
        bundlePolicy: 'max-bundle',
        rtcpMuxPolicy: 'require',
    });
    pc = peer;

    localStream.getTracks().forEach((track) => {
        if (localStream) peer.addTrack(track, localStream);
    });

    peer.onicecandidate = (event) => {
        if (event.candidate && activeCallUUID && currentDeviceId) {
            const callId = activeCallUUID;
            sendCandidate(callId, role, event.candidate.toJSON(), currentDeviceId).catch(() => undefined);
            const socket = connectSupportSocket();
            if (socket?.connected) {
                socket.emit('ice-candidate', {
                    callId,
                    candidate: event.candidate.toJSON(),
                    fromDeviceId: currentDeviceId,
                });
            }
        }
    };

    peer.onconnectionstatechange = () => {
        if (peer.connectionState === 'connected') {
            if (currentCallState === 'ringing' || currentCallState === 'calling') {
                if (!activeCallStartedAt) activeCallStartedAt = Date.now();
                setState('answered');
                onCallActiveChange?.(true, activeCallStartedAt);
            }
        }
    };

    peer.ontrack = (event) => {
        remoteStream = event.streams[0];
        if (!remoteAudio) remoteAudio = new Audio();
        remoteAudio.srcObject = remoteStream;
        remoteAudio.play().catch(() => undefined);
    };

    if (remoteOffer) {
        await peer.setRemoteDescription(new RTCSessionDescription(remoteOffer));
        await processQueuedIceCandidates(callUUID);
    }

    activeCallUUID = callUUID;
}

/** Ожидание answer: сокет (30 с) + HTTP-поллинг как запасной путь — как в панели. */
async function waitForAnswer(callId: string): Promise<void> {
    const currentPc = pc;
    if (!currentPc) return;

    const socket = connectSupportSocket();

    await new Promise<void>((resolve, reject) => {
        const timeout = setTimeout(() => {
            socket?.off('answer', onAnswer);
            reject(new SupportCallError('timeout', 0, 'timeout'));
        }, 30000);

        const finish = () => {
            clearTimeout(timeout);
            socket?.off('answer', onAnswer);
            resolve();
        };

        const onAnswer = async (data: { callId: string; answer: RTCSessionDescriptionInit }) => {
            if (data.callId !== callId || currentPc !== pc) return;
            await applyRemoteAnswer(callId, data.answer);
            finish();
        };

        socket?.on('answer', onAnswer);

        // Запасной путь: сервер отдаёт answer и по HTTP.
        void (async () => {
            for (let i = 0; i < 30; i += 1) {
                await new Promise((r) => setTimeout(r, 1000));
                if (currentPc !== pc || !activeCallUUID) return;
                if (currentCallState === 'answered') return finish();
                try {
                    const info = await getCall(callId);
                    if (info?.answer?.sdp && currentPc === pc) {
                        await applyRemoteAnswer(callId, info.answer as RTCSessionDescriptionInit);
                        if (currentCallState === 'answered') return finish();
                    }
                } catch {
                    // сеть моргнула — продолжаем опрос
                }
            }
        })();
    });
}

// --- публичное API -------------------------------------------------------------

/** Регистрация браузера как устройства. Вызывается после входа пользователя. */
export function initSupportCall(loyaltyId: string): void {
    if (!loyaltyId) return;
    if (isInitialized && currentLoyaltyId === loyaltyId) return;

    currentLoyaltyId = loyaltyId;
    currentDeviceId = currentDeviceId || generateUUID();
    isInitialized = true;

    registerDevice(currentDeviceId, loyaltyId).catch(() => undefined);

    const socket = bindSocket();
    if (socket?.connected && currentDeviceId) {
        socket.emit('registerDevice', { deviceId: currentDeviceId, loyaltyId });
    }
}

export function isSupportCallReady(): boolean {
    return isInitialized && Boolean(currentDeviceId) && Boolean(currentLoyaltyId);
}

/** Позвонить в поддержку. Адресат — аккаунт поддержки, как в приложении. */
export async function callSupport(): Promise<void> {
    if (!isSupportCallReady() || !currentDeviceId || !currentLoyaltyId) {
        lastError = 'unknown';
        throw new SupportCallError('not_ready', 0, 'not_ready');
    }
    if (currentCallState !== 'idle' && currentCallState !== 'ended' && currentCallState !== 'rejected') {
        return;
    }

    lastError = null;
    const callId = generateUUID();
    activeCallUUID = callId;
    activeCallStartedAt = null;
    setState('calling', SUPPORT_DISPLAY_NAME);

    bindSocket();

    try {
        await preparePeer(callId, null, 'caller');
    } catch (e) {
        lastError = 'microphone';
        teardown({ notifyBackend: false });
        setState('ended');
        throw e;
    }

    if (!pc) {
        teardown({ notifyBackend: false });
        throw new SupportCallError('no_peer', 0, 'no_peer');
    }

    try {
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);

        await startCall({
            callId,
            fromDeviceId: currentDeviceId,
            fromLoyaltyId: currentLoyaltyId,
            toLoyaltyId: SUPPORT_LOYALTY_ID,
            callerName: SUPPORT_DISPLAY_NAME,
            offer: { type: offer.type, sdp: offer.sdp || '' },
        });

        await waitForAnswer(callId);
    } catch (e) {
        lastError = e instanceof SupportCallError && e.code === 'offline' ? 'offline' : 'unknown';
        teardown({ notifyBackend: true });
        setState('ended');
        throw e;
    }
}

/** Ответить на входящий звонок оператора. */
export async function answerCall(): Promise<void> {
    const callId = activeCallUUID;
    if (!callId || !currentDeviceId) return;

    if (!pc) {
        const info = await getCall(callId);
        if (!info?.offer?.sdp) return;
        await preparePeer(callId, info.offer as RTCSessionDescriptionInit, 'callee');
    }
    if (!pc) return;

    const answer = await pc.createAnswer();
    await pc.setLocalDescription(answer);
    await sendAnswer(callId, { type: answer.type, sdp: answer.sdp || '' }, currentDeviceId);

    if (!activeCallStartedAt) activeCallStartedAt = Date.now();
    setState('answered');
    onCallActiveChange?.(true, activeCallStartedAt);
}

/** Отклонить входящий. */
export async function rejectCall(): Promise<void> {
    const callId = activeCallUUID;
    if (callId && currentDeviceId) {
        await rejectCallRequest(callId, currentDeviceId).catch(() => undefined);
    }
    setState('rejected');
    teardown({ notifyBackend: false });
}

/** Завершить активный звонок. */
export function endCall(): void {
    setState('ended');
    teardown({ notifyBackend: true });
}

function teardown({ notifyBackend, keepState }: { notifyBackend: boolean; keepState?: boolean }): void {
    queuedIceCandidates = [];

    if (pc) {
        try {
            pc.close();
        } catch {
            // ignore
        }
        pc = null;
    }
    if (localStream) {
        localStream.getTracks().forEach((t) => t.stop());
        localStream = null;
    }
    if (remoteStream) {
        remoteStream.getTracks().forEach((t) => t.stop());
        remoteStream = null;
    }
    if (remoteAudio) {
        remoteAudio.pause();
        remoteAudio.srcObject = null;
    }

    if (notifyBackend && activeCallUUID && currentDeviceId) {
        endCallRequest(activeCallUUID, currentDeviceId).catch(() => undefined);
    }

    activeCallUUID = null;
    activeCallStartedAt = null;
    isMuted = false;

    if (!keepState) {
        onCallActiveChange?.(false, null);
    }
}

/** Сбросить состояние в idle — после того, как пользователь закрыл карточку. */
export function resetCallState(): void {
    if (currentCallState === 'ended' || currentCallState === 'rejected') {
        lastError = null;
        setState('idle', null);
    }
}

export function toggleMute(): boolean {
    if (!localStream) return isMuted;
    isMuted = !isMuted;
    localStream.getAudioTracks().forEach((track) => {
        track.enabled = !isMuted;
    });
    return isMuted;
}

export function getCallState(): {
    state: CallState;
    callerName: string | null;
    isMuted: boolean;
    callUUID: string | null;
    error: CallErrorKind | null;
} {
    return {
        state: currentCallState,
        callerName,
        isMuted,
        callUUID: activeCallUUID,
        error: lastError,
    };
}

export function getActiveCallInfo(): { isActive: boolean; startedAt: number | null } {
    return {
        isActive: currentCallState === 'answered' && activeCallStartedAt !== null,
        startedAt: activeCallStartedAt,
    };
}

export function setCallStateChangeCallback(cb: ((state: CallState, name: string | null) => void) | null): void {
    onCallStateChange = cb;
}

export function setCallActiveChangeCallback(cb: ((isActive: boolean, startedAt: number | null) => void) | null): void {
    onCallActiveChange = cb;
}

/** Полный сброс при выходе из аккаунта. */
export function shutdownSupportCall(): void {
    teardown({ notifyBackend: true });
    isInitialized = false;
    currentLoyaltyId = null;
    currentDeviceId = null;
    currentCallState = 'idle';
    callerName = null;
    lastError = null;
}
