/**
 * Web Push на сайте: service worker public/sw.js, подписка PushManager, регистрация в хабе
 * (POST /api/push/devices). Подписка — ТОЛЬКО по явному действию пользователя (subscribeWebPush),
 * автоматически при заходе ничего не запрашивается. Всё только на клиенте.
 */
import {
    getVapidPublicKey,
    registerDevice,
    unregisterDevice,
    type WebPushSubscriptionJSON,
} from '@/api/notificationsApi';

export const SW_PATH = '/sw.js';
const DEVICE_ID_KEY = 'push:deviceId';

export type WebPushPermission = NotificationPermission | 'unsupported';

export interface WebPushStatus {
    supported: boolean;
    permission: WebPushPermission;
    subscribed: boolean;
    /** iOS Safari: push доступен только установленной на экран «Домой» PWA */
    needsPwa: boolean;
}

const isClient = () => typeof window !== 'undefined' && typeof navigator !== 'undefined';

export function isWebPushSupported(): boolean {
    if (!isClient()) return false;
    return 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;
}

export function isIos(): boolean {
    if (!isClient()) return false;
    const ua = navigator.userAgent || '';
    const iPadOs = navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1;
    return /iPhone|iPad|iPod/i.test(ua) || iPadOs;
}

export function isStandalonePwa(): boolean {
    if (!isClient()) return false;
    const nav = navigator as Navigator & { standalone?: boolean };
    if (typeof nav.standalone === 'boolean') return nav.standalone;
    try {
        return window.matchMedia('(display-mode: standalone)').matches;
    } catch {
        return false;
    }
}

/** iOS Safari вне установленной PWA — подписаться нельзя, показываем подсказку. */
export function needsPwaForPush(): boolean {
    return isIos() && !isStandalonePwa();
}

export function getPermission(): WebPushPermission {
    if (!isClient() || !('Notification' in window)) return 'unsupported';
    return Notification.permission;
}

/** Стабильный id установки (localStorage push:deviceId, uuid). */
export function getDeviceId(): string {
    if (!isClient()) return '';
    let id = '';
    try {
        id = localStorage.getItem(DEVICE_ID_KEY) || '';
    } catch {
        id = '';
    }
    if (!id) {
        id = createUuid();
        try {
            localStorage.setItem(DEVICE_ID_KEY, id);
        } catch {
            // приватный режим — id проживёт до перезагрузки
        }
    }
    return id;
}

function createUuid(): string {
    try {
        if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
            return crypto.randomUUID();
        }
    } catch {
        // ignore
    }
    const rnd = () => Math.floor(Math.random() * 0xffffffff).toString(16).padStart(8, '0');
    return `${rnd()}-${rnd().slice(0, 4)}-4${rnd().slice(0, 3)}-${rnd().slice(0, 4)}-${rnd()}${rnd().slice(0, 4)}`;
}

/** «Chrome · Windows» — кратко из userAgent, без персональных данных. */
export function getDeviceName(): string {
    if (!isClient()) return 'Сайт totus.club';
    const ua = navigator.userAgent || '';
    let browser = 'Браузер';
    if (/YaBrowser/i.test(ua)) browser = 'Яндекс Браузер';
    else if (/Edg\//i.test(ua)) browser = 'Edge';
    else if (/OPR\/|Opera/i.test(ua)) browser = 'Opera';
    else if (/Firefox/i.test(ua)) browser = 'Firefox';
    else if (/Chrome|CriOS/i.test(ua)) browser = 'Chrome';
    else if (/Safari/i.test(ua)) browser = 'Safari';

    let os = '';
    if (/Windows/i.test(ua)) os = 'Windows';
    else if (/iPhone|iPad|iPod/i.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)) os = 'iOS';
    else if (/Android/i.test(ua)) os = 'Android';
    else if (/Mac OS X|Macintosh/i.test(ua)) os = 'macOS';
    else if (/Linux/i.test(ua)) os = 'Linux';

    return os ? `${browser} · ${os}` : browser;
}

function getLocale(): string {
    if (!isClient()) return 'ru';
    const lang = navigator.language || 'ru';
    return lang.split('-')[0] || 'ru';
}

export function urlBase64ToUint8Array(base64String: string): Uint8Array {
    const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
    const raw = atob(base64);
    const output = new Uint8Array(raw.length);
    for (let i = 0; i < raw.length; i += 1) {
        output[i] = raw.charCodeAt(i);
    }
    return output;
}

/** navigator.serviceWorker.register('/sw.js') — без подписки и без запроса разрешения. */
export async function registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
    if (!isWebPushSupported()) return null;
    try {
        const registration = await navigator.serviceWorker.register(SW_PATH, { scope: '/' });
        return registration;
    } catch {
        return null;
    }
}

async function getRegistration(): Promise<ServiceWorkerRegistration | null> {
    if (!isWebPushSupported()) return null;
    try {
        const existing = await navigator.serviceWorker.getRegistration('/');
        if (existing) return existing;
    } catch {
        // ignore
    }
    return registerServiceWorker();
}

async function getCurrentSubscription(): Promise<PushSubscription | null> {
    if (!isWebPushSupported()) return null;
    try {
        const registration = await navigator.serviceWorker.getRegistration('/');
        if (!registration) return null;
        return await registration.pushManager.getSubscription();
    } catch {
        return null;
    }
}

export async function getWebPushStatus(): Promise<WebPushStatus> {
    const supported = isWebPushSupported();
    const needsPwa = needsPwaForPush();
    if (!supported) {
        return { supported: false, permission: 'unsupported', subscribed: false, needsPwa };
    }
    const subscription = await getCurrentSubscription();
    return {
        supported: true,
        permission: getPermission(),
        subscribed: Boolean(subscription),
        needsPwa,
    };
}

function toSubscriptionJSON(subscription: PushSubscription): WebPushSubscriptionJSON {
    const json = subscription.toJSON();
    return {
        endpoint: String(json.endpoint || subscription.endpoint),
        expirationTime: json.expirationTime ?? null,
        keys: {
            p256dh: String(json.keys?.p256dh || ''),
            auth: String(json.keys?.auth || ''),
        },
    };
}

async function resolveVapidKey(): Promise<string> {
    const fromEnv = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
    if (fromEnv) return fromEnv;
    return getVapidPublicKey();
}

export class WebPushError extends Error {
    code: 'unsupported' | 'needs_pwa' | 'denied' | 'subscribe_failed' | 'register_failed';

    constructor(code: WebPushError['code'], message: string) {
        super(message);
        this.name = 'WebPushError';
        this.code = code;
    }
}

/** Отправляет подписку в хаб (привязка к текущему пользователю). */
export async function registerSubscription(subscription: PushSubscription | WebPushSubscriptionJSON): Promise<number> {
    const json = 'toJSON' in subscription ? toSubscriptionJSON(subscription) : subscription;
    const result = await registerDevice({
        subscription: json,
        deviceId: getDeviceId(),
        deviceName: getDeviceName(),
        locale: getLocale(),
    });
    return Number(result?.unread || 0);
}

/**
 * Подписка по клику пользователя: разрешение → pushManager.subscribe → POST /api/push/devices.
 * Бросает WebPushError с русским сообщением.
 */
export async function subscribeWebPush(): Promise<WebPushStatus> {
    if (!isWebPushSupported()) {
        throw new WebPushError(
            'unsupported',
            needsPwaForPush()
                ? 'Добавьте сайт на экран «Домой», чтобы получать уведомления'
                : 'Ваш браузер не поддерживает push-уведомления',
        );
    }
    if (needsPwaForPush()) {
        throw new WebPushError('needs_pwa', 'Добавьте сайт на экран «Домой», чтобы получать уведомления');
    }
    const registration = await getRegistration();
    if (!registration) {
        throw new WebPushError('subscribe_failed', 'Не удалось запустить service worker');
    }

    let permission = Notification.permission;
    if (permission === 'default') {
        permission = await Notification.requestPermission();
    }
    if (permission !== 'granted') {
        throw new WebPushError('denied', 'Уведомления запрещены в настройках браузера');
    }

    let subscription = await registration.pushManager.getSubscription();
    if (!subscription) {
        let key: string;
        try {
            key = await resolveVapidKey();
        } catch {
            throw new WebPushError('subscribe_failed', 'Уведомления временно недоступны');
        }
        try {
            subscription = await registration.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: urlBase64ToUint8Array(key) as BufferSource,
            });
        } catch {
            throw new WebPushError('subscribe_failed', 'Не удалось оформить подписку на уведомления');
        }
    }

    try {
        await registerSubscription(subscription);
    } catch (error) {
        throw new WebPushError(
            'register_failed',
            (error as Error)?.message || 'Уведомления временно недоступны',
        );
    }

    return { supported: true, permission: 'granted', subscribed: true, needsPwa: false };
}

/** Отписка: DELETE /api/push/devices + subscription.unsubscribe(). */
export async function unsubscribeWebPush(): Promise<WebPushStatus> {
    const subscription = await getCurrentSubscription();
    if (subscription) {
        try {
            await unregisterDevice({ subscription: toSubscriptionJSON(subscription) });
        } catch {
            // сервер недоступен — всё равно отписываемся в браузере, мёртвая подписка удалится по 404/410
        }
        try {
            await subscription.unsubscribe();
        } catch {
            // ignore
        }
    }
    return {
        supported: isWebPushSupported(),
        permission: getPermission(),
        subscribed: false,
        needsPwa: needsPwaForPush(),
    };
}

/**
 * При входе: если подписка уже есть в браузере — повторный POST /api/push/devices,
 * чтобы привязать её к текущему пользователю. Разрешение НЕ запрашивает.
 */
export async function syncWebPushSubscription(): Promise<boolean> {
    if (!isWebPushSupported()) return false;
    if (getPermission() !== 'granted') return false;
    const subscription = await getCurrentSubscription();
    if (!subscription) return false;
    try {
        await registerSubscription(subscription);
        return true;
    } catch {
        return false;
    }
}

export interface ServiceWorkerNotificationClick {
    type: 'notification-click';
    data: Record<string, unknown>;
    url?: string;
}

export interface ServiceWorkerResubscribed {
    type: 'push-resubscribed';
    subscription: WebPushSubscriptionJSON;
}

/** Пуш пришёл при видимой вкладке — sw.js не показывает системный баннер, страница показывает тост. */
export interface ServiceWorkerNotificationPush {
    type: 'notification-push';
    data: { title?: string; body?: string; data?: Record<string, unknown> | null };
}

export type ServiceWorkerMessage =
    | ServiceWorkerNotificationClick
    | ServiceWorkerResubscribed
    | ServiceWorkerNotificationPush;

/** Сообщения от sw.js (клик по уведомлению, переподписка). Возвращает функцию отписки. */
export function listenServiceWorkerMessages(handler: (message: ServiceWorkerMessage) => void): () => void {
    if (!isClient() || !('serviceWorker' in navigator)) return () => {};
    const listener = (event: MessageEvent) => {
        const message = event.data as ServiceWorkerMessage | null;
        if (!message || typeof message !== 'object' || typeof message.type !== 'string') return;
        if (
            message.type === 'notification-click' ||
            message.type === 'push-resubscribed' ||
            message.type === 'notification-push'
        ) {
            handler(message);
        }
    };
    navigator.serviceWorker.addEventListener('message', listener);
    return () => {
        navigator.serviceWorker.removeEventListener('message', listener);
    };
}

/** Маршрут уведомления → путь сайта (дублирует routeToUrl из sw.js для тостов и списка). */
export function notificationRouteToPath(data: Record<string, unknown> | null | undefined): string {
    const route = data && typeof data.route === 'string' ? data.route : '';
    const orderId = data && data.orderId != null && data.orderId !== '' ? String(data.orderId) : '';
    switch (route) {
        case 'order':
        case 'documents':
        case 'order_request':
            return orderId ? `/profile/my-orders/${encodeURIComponent(orderId)}` : '/profile/my-orders';
        case 'orders':
            return '/profile/my-orders';
        case 'support_chat':
            return '/profile/support-chat';
        case 'notifications':
        case 'account':
            return '/profile/notifications';
        case 'search':
            return '/search';
        case 'url': {
            const url = data && typeof data.url === 'string' ? data.url : '';
            return safeUrl(url) || '/';
        }
        case 'home':
        default:
            return '/';
    }
}

/** Только http(s), тот же origin или totus.club. Для своего origin возвращает относительный путь. */
export function safeUrl(value: string): string | null {
    if (!value || !isClient()) return null;
    try {
        const url = new URL(value, window.location.origin);
        if (url.protocol !== 'https:' && url.protocol !== 'http:') return null;
        if (url.origin === window.location.origin) return `${url.pathname}${url.search}${url.hash}`;
        if (url.hostname === 'totus.club' || url.hostname === 'www.totus.club') return url.href;
        return null;
    } catch {
        return null;
    }
}

/** Внешняя ссылка (другой origin) — открывать через window.location, а не router.push. */
export function isExternalPath(path: string): boolean {
    return /^https?:\/\//i.test(path);
}
