/**
 * Socket.io-клиент calling_api_v2 (voip.totus.club) для чата с поддержкой.
 * Singleton, только на клиенте. Токен берётся из localStorage при каждом (пере)подключении,
 * поэтому после refresh access-токена reconnect уходит уже с новым JWT.
 *
 * События сервера: support:message, support:chat-updated, support:read, support:typing (см. API.md).
 */
import { io, type Socket } from 'socket.io-client';
import { VOIP_BASE_URL } from '@/config/api';
import { loadToken } from '@/utils/auth';

let socket: Socket | null = null;

const isClient = () => typeof window !== 'undefined';

export function getSupportSocket(): Socket | null {
    return socket;
}

/** Создаёт (при необходимости) и подключает сокет. На сервере — no-op. */
export function connectSupportSocket(): Socket | null {
    if (!isClient()) return null;
    if (!socket) {
        socket = io(VOIP_BASE_URL, {
            transports: ['websocket'],
            autoConnect: false,
            reconnection: true,
            reconnectionDelay: 1000,
            reconnectionDelayMax: 10000,
            auth: (cb) => cb({ token: loadToken() || undefined }),
        });
    }
    if (!socket.connected) {
        socket.connect();
    }
    return socket;
}

/** Полностью отключает и удаляет сокет (например, при logout). */
export function disconnectSupportSocket(): void {
    if (!socket) return;
    try {
        socket.removeAllListeners();
        socket.disconnect();
    } catch {
        // ignore
    }
    socket = null;
}

/** Подписка на событие сервера; возвращает функцию отписки. */
export function onSupportEvent<T = unknown>(
    event: string,
    handler: (payload: T) => void,
): () => void {
    const s = connectSupportSocket();
    if (!s) return () => {};
    s.on(event, handler as (...args: unknown[]) => void);
    return () => {
        s.off(event, handler as (...args: unknown[]) => void);
    };
}

/** Отправка события с опциональным ack. Если сокет не подключён — ack не будет вызван. */
export function emitSupport<T = unknown>(
    event: string,
    payload: Record<string, unknown>,
    ack?: (result: T) => void,
): boolean {
    const s = isClient() ? socket : null;
    if (!s || !s.connected) return false;
    if (ack) {
        s.emit(event, payload, ack);
    } else {
        s.emit(event, payload);
    }
    return true;
}
