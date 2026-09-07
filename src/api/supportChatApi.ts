/**
 * Чат с поддержкой — REST calling_api_v2 (voip.totus.club), см. API.md проекта.
 * Все запросы с Bearer пользовательского JWT (тот же auth_token, что и для totus_API).
 */
import { VOIP_BASE_URL } from '@/config/api';
import { loadToken } from '@/utils/auth';

export type SupportChatStatus = 'open' | 'pending' | 'closed';
export type SupportSenderRole = 'user' | 'staff' | 'agent' | 'system';

export interface SupportMessageMeta {
    orderId?: string | number | null;
    orderTitle?: string | null;
    orderSubtitle?: string | null;
    topic?: string | null;
}

export interface SupportChat {
    id: number;
    userId: number;
    status: SupportChatStatus;
    assignedId: number | null;
    assignedRole: string | null;
    assignedName: string | null;
    subject: string | null;
    orderId: string | number | null;
    lastMessageId: number | null;
    lastMessageAt: string | null;
    lastMessagePreview: string | null;
    userUnread: number;
    staffUnread: number;
    createdAt: string;
    updatedAt: string;
}

export interface SupportMessage {
    id: number;
    chatId: number;
    senderRole: SupportSenderRole;
    senderId: number | null;
    senderName: string | null;
    body: string;
    meta: SupportMessageMeta | null;
    clientMsgId: string | null;
    readAt: string | null;
    createdAt: string;
}

export interface SupportHours {
    open?: string;
    close?: string;
    tz?: string;
    text?: string;
}

export interface SupportChatResponse {
    chat: SupportChat;
    messages: SupportMessage[];
    hasMore: boolean;
    hours?: SupportHours | null;
}

export interface SupportMessagesResponse {
    messages: SupportMessage[];
    hasMore: boolean;
}

export interface SendSupportMessageParams {
    body: string;
    clientMsgId?: string;
    meta?: SupportMessageMeta;
}

export interface SendSupportMessageResponse {
    ok: boolean;
    chat: SupportChat;
    message: SupportMessage;
}

export const SUPPORT_MESSAGE_MAX_LENGTH = 4000;

export const SUPPORT_CHAT_UNAVAILABLE = 'Чат временно недоступен';

const ERROR_MESSAGES: Record<string, string> = {
    rate_limited: 'Слишком много сообщений, подождите минуту',
    message_too_long: 'Сообщение слишком длинное (до 4000 символов)',
    body_required: 'Введите текст сообщения',
    support_chat_not_migrated: SUPPORT_CHAT_UNAVAILABLE,
    unauthorized: 'Требуется авторизация. Войдите в аккаунт и попробуйте снова',
    forbidden: 'Требуется авторизация. Войдите в аккаунт и попробуйте снова',
    chat_not_found: 'Диалог не найден',
};

export class SupportChatError extends Error {
    code: string;
    status: number;

    constructor(code: string, status: number, message: string) {
        super(message);
        this.name = 'SupportChatError';
        this.code = code;
        this.status = status;
    }
}

function authHeaders(): Record<string, string> {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    const token = loadToken();
    if (token) {
        headers.Authorization = `Bearer ${token}`;
    }
    return headers;
}

async function toError(response: Response): Promise<SupportChatError> {
    const data = await response.json().catch(() => ({}));
    let code = String((data as { error?: string })?.error || '');
    if (!code) {
        if (response.status === 401) code = 'unauthorized';
        else if (response.status === 403) code = 'forbidden';
        else if (response.status === 429) code = 'rate_limited';
        else if (response.status === 503) code = 'support_chat_not_migrated';
        else code = 'unknown';
    }
    return new SupportChatError(code, response.status, ERROR_MESSAGES[code] || SUPPORT_CHAT_UNAVAILABLE);
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
    let response: Response;
    try {
        response = await fetch(`${VOIP_BASE_URL}${path}`, {
            ...init,
            headers: { ...authHeaders(), ...(init?.headers as Record<string, string> | undefined) },
        });
    } catch {
        // сеть / CORS / сервер недоступен
        throw new SupportChatError('network', 0, SUPPORT_CHAT_UNAVAILABLE);
    }
    if (!response.ok) {
        throw await toError(response);
    }
    return response.json() as Promise<T>;
}

/** Текст ошибки для UI (любая ошибка → русское сообщение). */
export function supportErrorMessage(error: unknown): string {
    if (error instanceof SupportChatError) return error.message;
    return SUPPORT_CHAT_UNAVAILABLE;
}

/** UUID для дедупликации сообщений (повтор clientMsgId → сервер вернёт то же сообщение). */
export function createClientMsgId(): string {
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

/** GET /api/support/chat — диалог пользователя (создаётся при первом обращении) + последние сообщения. */
export async function getSupportChat(limit = 50): Promise<SupportChatResponse> {
    const data = await request<Partial<SupportChatResponse>>(
        `/api/support/chat?limit=${encodeURIComponent(String(limit))}`,
    );
    return {
        chat: data.chat as SupportChat,
        messages: Array.isArray(data.messages) ? data.messages : [],
        hasMore: Boolean(data.hasMore),
        hours: data.hours ?? null,
    };
}

/** GET /api/support/chat/messages?before=&limit= — страница истории вверх. */
export async function getSupportMessages({
    before,
    limit = 50,
}: {
    before?: number | null;
    limit?: number;
}): Promise<SupportMessagesResponse> {
    const params = new URLSearchParams();
    if (before) params.set('before', String(before));
    params.set('limit', String(limit));
    const data = await request<Partial<SupportMessagesResponse>>(
        `/api/support/chat/messages?${params.toString()}`,
    );
    return {
        messages: Array.isArray(data.messages) ? data.messages : [],
        hasMore: Boolean(data.hasMore),
    };
}

/** POST /api/support/chat/messages — отправить сообщение (201; повтор clientMsgId → 200, то же сообщение). */
export async function sendSupportMessage({
    body,
    clientMsgId,
    meta,
}: SendSupportMessageParams): Promise<SendSupportMessageResponse> {
    return request<SendSupportMessageResponse>('/api/support/chat/messages', {
        method: 'POST',
        body: JSON.stringify({
            body,
            ...(clientMsgId ? { clientMsgId } : {}),
            ...(meta ? { meta } : {}),
        }),
    });
}

/** POST /api/support/chat/read — обнуляет userUnread. */
export async function markSupportRead(
    lastMessageId?: number | null,
): Promise<{ ok: boolean; chat: SupportChat }> {
    return request<{ ok: boolean; chat: SupportChat }>('/api/support/chat/read', {
        method: 'POST',
        body: JSON.stringify(lastMessageId ? { lastMessageId } : {}),
    });
}
