/**
 * Звонок в поддержку — REST calling_api_v2 (voip.totus.club).
 *
 * Перенос панели оператора `calling_v2/lib/webrtc-service.ts`: те же маршруты,
 * те же тела запросов, тот же порядок вызовов. Отличие одно — Bearer здесь
 * пользовательский (`loadToken()`), а не agent-JWT панели.
 *
 * Сетевой слой вынесен отдельно от WebRTC (см. `src/lib/supportCall.ts`),
 * как это сделано у чата поддержки (`supportChatApi.ts`).
 */
import { VOIP_BASE_URL } from '@/config/api';
import { loadToken } from '@/utils/auth';

export interface CallSdp {
    type: string;
    sdp: string;
}

export interface CallInfo {
    callId?: string;
    fromDeviceId?: string;
    toDeviceId?: string;
    fromLoyaltyId?: string;
    toLoyaltyId?: string;
    callerName?: string;
    offer?: CallSdp | null;
    answer?: CallSdp | null;
    state?: string;
}

export class SupportCallError extends Error {
    code: string;
    status: number;

    constructor(code: string, status: number, message: string) {
        super(message);
        this.name = 'SupportCallError';
        this.code = code;
        this.status = status;
    }
}

/** Текст ошибки для интерфейса. Отдельно — «оператор не на линии» (сервер отвечает 404). */
export function supportCallErrorMessage(error: unknown): string {
    if (error instanceof SupportCallError) {
        if (error.code === 'offline') return 'Оператор сейчас не на линии';
        if (error.code === 'unauthorized') return 'Войдите в аккаунт и попробуйте снова';
        if (error.code === 'network') return 'Нет связи с сервером звонков';
    }
    return 'Не удалось дозвониться';
}

function authHeaders(): Record<string, string> {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    const token = loadToken();
    if (token) headers.Authorization = `Bearer ${token}`;
    return headers;
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
    let response: Response;
    try {
        response = await fetch(`${VOIP_BASE_URL}${path}`, {
            ...init,
            headers: { ...authHeaders(), ...(init?.headers as Record<string, string> | undefined) },
        });
    } catch {
        throw new SupportCallError('network', 0, 'Нет связи с сервером звонков');
    }

    if (!response.ok) {
        const data = (await response.json().catch(() => ({}))) as { error?: string };
        let code = String(data?.error || '');
        // 404 на POST /api/calls означает «адресат не зарегистрирован / не в сети»
        if (response.status === 404) code = 'offline';
        else if (response.status === 401) code = 'unauthorized';
        else if (response.status === 403) code = 'forbidden';
        else if (!code) code = 'unknown';
        throw new SupportCallError(code, response.status, code);
    }

    if (response.status === 204) return undefined as T;
    return (await response.json().catch(() => ({}))) as T;
}

/** POST /api/register-device — веб регистрируется с фиктивным voipToken (бэкенд требует поле). */
export async function registerDevice(deviceId: string, loyaltyId: string): Promise<void> {
    await request('/api/register-device', {
        method: 'POST',
        body: JSON.stringify({
            deviceId,
            loyaltyId,
            voipToken: `web-${deviceId}`,
            platform: 'web',
        }),
    });
}

/** GET /api/ice-servers — STUN/TURN с бэкенда (креды больше не зашиты в бандл). */
export async function getIceServers(): Promise<{
    iceServers?: RTCIceServer[];
    expiresAt?: number;
    mode?: string;
}> {
    return request('/api/ice-servers');
}

/** POST /api/calls — начать звонок. Тело один в один как в панели оператора. */
export async function startCall(params: {
    callId: string;
    fromDeviceId: string;
    fromLoyaltyId: string;
    toLoyaltyId: string;
    callerName: string;
    offer: CallSdp;
}): Promise<void> {
    await request('/api/calls', {
        method: 'POST',
        body: JSON.stringify(params),
    });
}

/** GET /api/calls/:callId — опрос offer/answer (запасной путь, если сокет молчит). */
export async function getCall(callId: string): Promise<CallInfo> {
    return request(`/api/calls/${encodeURIComponent(callId)}`);
}

/** POST /api/calls/:callId/answer — ответ на входящий. */
export async function sendAnswer(callId: string, answer: CallSdp, deviceId: string): Promise<void> {
    await request(`/api/calls/${encodeURIComponent(callId)}/answer`, {
        method: 'POST',
        body: JSON.stringify({ answer, deviceId }),
    });
}

/** POST /api/calls/:callId/candidate — ICE-кандидат. */
export async function sendCandidate(
    callId: string,
    from: 'caller' | 'callee',
    candidate: RTCIceCandidateInit,
    deviceId: string,
): Promise<void> {
    await request(`/api/calls/${encodeURIComponent(callId)}/candidate`, {
        method: 'POST',
        body: JSON.stringify({ from, candidate, deviceId }),
    });
}

/**
 * keepalive: true — запрос уходит, даже если страница закрывается (вкладка закрыта крестиком,
 * перезагрузка, переход на другой сайт): браузер доводит его после выгрузки страницы.
 */
type ExitOptions = { keepalive?: boolean };

/** POST /api/calls/:callId/reject */
export async function rejectCallRequest(callId: string, deviceId: string, options: ExitOptions = {}): Promise<void> {
    await request(`/api/calls/${encodeURIComponent(callId)}/reject`, {
        method: 'POST',
        body: JSON.stringify({ deviceId }),
        keepalive: options.keepalive === true,
    });
}

/** POST /api/calls/:callId/end */
export async function endCallRequest(callId: string, deviceId: string, options: ExitOptions = {}): Promise<void> {
    await request(`/api/calls/${encodeURIComponent(callId)}/end`, {
        method: 'POST',
        body: JSON.stringify({ deviceId }),
        keepalive: options.keepalive === true,
    });
}

/**
 * GET /api/users/by-id/:userId — профиль в calling_api_v2.
 * Нужен ради поля `access`: в приложении раздел звонка показывается только
 * при `access === 0`, и в пользовательский JWT это поле не входит.
 */
export async function getVoipUser(userId: number | string): Promise<{ access?: number; loyaltyId?: string } | null> {
    try {
        return await request(`/api/users/by-id/${encodeURIComponent(String(userId))}`);
    } catch {
        return null;
    }
}
