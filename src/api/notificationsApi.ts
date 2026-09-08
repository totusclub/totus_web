/**
 * Центр уведомлений и Web Push — REST хаба calling_api_v2 (voip.totus.club), см. API.md проекта.
 * Все запросы с Bearer пользовательского JWT (тот же auth_token, что и для totus_API).
 */
import { VOIP_BASE_URL } from '@/config/api';
import { loadToken } from '@/utils/auth';

export type NotificationCategory = 'orders' | 'documents' | 'reminders' | 'support' | 'promo' | 'system';

export type NotificationType =
    | 'order_created'
    | 'payment_success'
    | 'payment_failed'
    | 'order_request_status'
    | 'order_confirmed'
    | 'order_status'
    | 'order_cancelled'
    | 'documents_ready'
    | 'trip_reminder'
    | 'support_message'
    | 'missed_call'
    | 'promo'
    | 'system'
    | string;

export type NotificationRoute =
    | 'home'
    | 'order'
    | 'orders'
    | 'documents'
    | 'order_request'
    | 'support_chat'
    | 'account'
    | 'notifications'
    | 'url'
    | 'search'
    | string;

export interface NotificationData {
    route?: NotificationRoute;
    orderId?: string | number | null;
    chatId?: string | number | null;
    url?: string | null;
    notificationId?: string | number | null;
    campaignId?: string | number | null;
    ruleId?: string | number | null;
    type?: string;
    [key: string]: unknown;
}

export interface NotificationItem {
    id: number;
    type: NotificationType;
    category: NotificationCategory;
    title: string;
    body: string;
    data: NotificationData | null;
    source?: string | null;
    readAt: string | null;
    openedAt: string | null;
    createdAt: string;
}

/** Событие сокета notify:new (без readAt/openedAt). */
export interface NotificationEvent {
    id: number;
    type: NotificationType;
    category: NotificationCategory;
    title: string;
    body: string;
    data?: NotificationData | null;
    createdAt: string;
}

export interface NotificationsListResponse {
    items: NotificationItem[];
    hasMore: boolean;
    unread: number;
}

export interface NotificationPrefs {
    orders: boolean;
    documents: boolean;
    reminders: boolean;
    support: boolean;
    promo: boolean;
    system: boolean;
}

export interface NotificationCategoryInfo {
    key: NotificationCategory;
    title: string;
    mandatory: boolean;
    enabled: boolean;
}

export interface QuietHours {
    from?: string;
    to?: string;
    tz?: string;
    text?: string;
    [key: string]: unknown;
}

export interface NotificationSettings {
    prefs: NotificationPrefs;
    email: boolean;
    sound: boolean;
    categories: NotificationCategoryInfo[];
    quietHours?: QuietHours | string | null;
}

export type PushPlatform = 'ios' | 'android' | 'web' | 'desktop';
export type PushChannel = 'fcm' | 'webpush';

export interface PushDevice {
    id: number;
    platform: PushPlatform;
    channel: PushChannel;
    deviceId: string | null;
    deviceName: string | null;
    enabled: boolean;
    tokenTail: string | null;
    lastSeenAt: string | null;
}

export interface NotificationSettingsResponse {
    settings: NotificationSettings;
    devices: PushDevice[];
}

export interface UpdateSettingsParams {
    prefs?: Partial<NotificationPrefs>;
    email?: boolean;
    sound?: boolean;
}

export interface WebPushSubscriptionJSON {
    endpoint: string;
    expirationTime?: number | null;
    keys: { p256dh: string; auth: string };
}

export interface RegisterDeviceParams {
    subscription: WebPushSubscriptionJSON;
    deviceId: string;
    deviceName?: string;
    appVersion?: string;
    locale?: string;
}

export interface RegisterDeviceResponse {
    ok: boolean;
    device: PushDevice;
    unread: number;
}

export interface NotificationsListParams {
    before?: number | null;
    limit?: number;
    category?: NotificationCategory | null;
    unread?: boolean;
}

/** Категория по типу (API.md §2) — для пуша, где category в payload нет. */
export function categoryForType(type: string | null | undefined): NotificationCategory {
    switch (type) {
        case 'order_created':
        case 'payment_success':
        case 'payment_failed':
        case 'order_request_status':
            return 'orders';
        case 'order_confirmed':
        case 'order_status':
        case 'order_cancelled':
        case 'documents_ready':
            return 'documents';
        case 'trip_reminder':
            return 'reminders';
        case 'support_message':
        case 'missed_call':
            return 'support';
        case 'promo':
            return 'promo';
        case 'system':
        default:
            return 'system';
    }
}

export const NOTIFICATIONS_UNAVAILABLE = 'Уведомления временно недоступны';

const ERROR_MESSAGES: Record<string, string> = {
    notifications_not_migrated: NOTIFICATIONS_UNAVAILABLE,
    network: NOTIFICATIONS_UNAVAILABLE,
    unauthorized: 'Требуется авторизация. Войдите в аккаунт и попробуйте снова',
    forbidden: 'Требуется авторизация. Войдите в аккаунт и попробуйте снова',
    not_found: 'Уведомление не найдено',
    platform_invalid: 'Не удалось зарегистрировать браузер для push-уведомлений',
    subscription_invalid: 'Не удалось зарегистрировать браузер для push-уведомлений',
    token_invalid: 'Не удалось зарегистрировать браузер для push-уведомлений',
    rate_limited: 'Слишком много запросов, подождите минуту',
};

export class NotificationsError extends Error {
    code: string;
    status: number;

    constructor(code: string, status: number, message: string) {
        super(message);
        this.name = 'NotificationsError';
        this.code = code;
        this.status = status;
    }
}

/** Текст ошибки по коду хаба (любой неизвестный код → «временно недоступны»). */
export function notificationsErrorMessage(code: unknown): string {
    if (code instanceof NotificationsError) return code.message;
    if (typeof code === 'string' && ERROR_MESSAGES[code]) return ERROR_MESSAGES[code];
    return NOTIFICATIONS_UNAVAILABLE;
}

function authHeaders(): Record<string, string> {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    const token = loadToken();
    if (token) {
        headers.Authorization = `Bearer ${token}`;
    }
    return headers;
}

async function toError(response: Response): Promise<NotificationsError> {
    const data = await response.json().catch(() => ({}));
    let code = String((data as { error?: string })?.error || '');
    if (!code) {
        if (response.status === 401) code = 'unauthorized';
        else if (response.status === 403) code = 'forbidden';
        else if (response.status === 404) code = 'not_found';
        else if (response.status === 429) code = 'rate_limited';
        else if (response.status === 503) code = 'notifications_not_migrated';
        else code = 'unknown';
    }
    return new NotificationsError(code, response.status, ERROR_MESSAGES[code] || NOTIFICATIONS_UNAVAILABLE);
}

async function request<T>(path: string, init?: RequestInit, auth = true): Promise<T> {
    let response: Response;
    try {
        response = await fetch(`${VOIP_BASE_URL}${path}`, {
            ...init,
            headers: {
                ...(auth ? authHeaders() : { 'Content-Type': 'application/json' }),
                ...(init?.headers as Record<string, string> | undefined),
            },
        });
    } catch {
        // сеть / CORS / сервер недоступен
        throw new NotificationsError('network', 0, NOTIFICATIONS_UNAVAILABLE);
    }
    if (!response.ok) {
        throw await toError(response);
    }
    if (response.status === 204) return {} as T;
    return response.json() as Promise<T>;
}

/** GET /api/notifications?before=&limit=&category=&unread=1 */
export async function getNotifications({
    before,
    limit = 30,
    category,
    unread,
}: NotificationsListParams = {}): Promise<NotificationsListResponse> {
    const params = new URLSearchParams();
    if (before) params.set('before', String(before));
    params.set('limit', String(limit));
    if (category) params.set('category', category);
    if (unread) params.set('unread', '1');
    const data = await request<Partial<NotificationsListResponse>>(`/api/notifications?${params.toString()}`);
    return {
        items: Array.isArray(data.items) ? data.items : [],
        hasMore: Boolean(data.hasMore),
        unread: Number(data.unread || 0),
    };
}

/** GET /api/notifications/unread */
export async function getUnread(): Promise<number> {
    const data = await request<{ unread?: number }>('/api/notifications/unread');
    return Number(data.unread || 0);
}

/** POST /api/notifications/read — { ids } | { all: true } */
export async function markRead(target: number[] | 'all'): Promise<{ ok: boolean; unread: number }> {
    const body = target === 'all' ? { all: true } : { ids: target };
    const data = await request<{ ok?: boolean; unread?: number }>('/api/notifications/read', {
        method: 'POST',
        body: JSON.stringify(body),
    });
    return { ok: Boolean(data.ok), unread: Number(data.unread || 0) };
}

/** POST /api/notifications/opened — тап по пушу/элементу (помечает прочитанным). */
export async function markOpened(id: number): Promise<{ ok: boolean; unread: number }> {
    const data = await request<{ ok?: boolean; unread?: number }>('/api/notifications/opened', {
        method: 'POST',
        body: JSON.stringify({ id }),
    });
    return { ok: Boolean(data.ok), unread: Number(data.unread || 0) };
}

/** DELETE /api/notifications/:id */
export async function deleteNotification(id: number): Promise<void> {
    await request<unknown>(`/api/notifications/${encodeURIComponent(String(id))}`, { method: 'DELETE' });
}

/** GET /api/notifications/settings */
export async function getSettings(): Promise<NotificationSettingsResponse> {
    const data = await request<Partial<NotificationSettingsResponse>>('/api/notifications/settings');
    return {
        settings: data.settings as NotificationSettings,
        devices: Array.isArray(data.devices) ? data.devices : [],
    };
}

/** PUT /api/notifications/settings — обязательные категории сервер всегда оставляет true. */
export async function updateSettings(params: UpdateSettingsParams): Promise<NotificationSettingsResponse> {
    const data = await request<Partial<NotificationSettingsResponse>>('/api/notifications/settings', {
        method: 'PUT',
        body: JSON.stringify(params),
    });
    return {
        settings: data.settings as NotificationSettings,
        devices: Array.isArray(data.devices) ? data.devices : [],
    };
}

/** POST /api/push/devices — регистрация браузера (upsert по подписке, привязка к текущему пользователю). */
export async function registerDevice({
    subscription,
    deviceId,
    deviceName,
    appVersion,
    locale,
}: RegisterDeviceParams): Promise<RegisterDeviceResponse> {
    return request<RegisterDeviceResponse>('/api/push/devices', {
        method: 'POST',
        body: JSON.stringify({
            platform: 'web',
            channel: 'webpush',
            subscription,
            deviceId,
            ...(deviceName ? { deviceName } : {}),
            ...(appVersion ? { appVersion } : {}),
            ...(locale ? { locale } : {}),
        }),
    });
}

/** DELETE /api/push/devices — { subscription } | { deviceId } */
export async function unregisterDevice(
    target: { subscription: WebPushSubscriptionJSON } | { deviceId: string },
): Promise<void> {
    await request<unknown>('/api/push/devices', {
        method: 'DELETE',
        body: JSON.stringify(target),
    });
}

/** GET /api/push/vapid-public-key (публичный) */
export async function getVapidPublicKey(): Promise<string> {
    const data = await request<{ publicKey?: string }>('/api/push/vapid-public-key', undefined, false);
    const key = String(data.publicKey || '');
    if (!key) throw new NotificationsError('vapid_missing', 0, NOTIFICATIONS_UNAVAILABLE);
    return key;
}
