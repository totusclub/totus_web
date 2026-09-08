/*
 * Totus Club — service worker для Web Push.
 * Только push-уведомления: кэширования/офлайна нет, fetch не перехватывается.
 * Payload от хаба (calling_api_v2, API.md §4):
 *   { title, body, icon, badge, tag, renotify, data: { type, route, notificationId, orderId?, chatId?, url? } }
 */

const DEFAULT_TITLE = 'Totus Club';

/*
 * Хаб присылает icon: "/icons/icon-192.png", badge: "/icons/badge-72.png".
 * В public/ пока нет папки icons — подменяем на существующие иконки сайта.
 * Когда владелец добавит public/icons/icon-192.png и badge-72.png — очистить карту (оставить {}).
 */
const ICON_MAP = {
    '/icons/icon-192.png': '/android-chrome-192x192.png',
    '/icons/badge-72.png': '/favicon-32x32.png',
};
const DEFAULT_ICON = '/android-chrome-192x192.png';

/* Хосты, на которые разрешено вести data.url (кроме собственного origin). */
const ALLOWED_HOSTS = ['totus.club', 'www.totus.club'];

self.addEventListener('install', () => {
    self.skipWaiting();
});

self.addEventListener('activate', (event) => {
    event.waitUntil(self.clients.claim());
});

function resolveIcon(path, fallback) {
    if (typeof path !== 'string' || !path) return fallback;
    if (Object.prototype.hasOwnProperty.call(ICON_MAP, path)) return ICON_MAP[path];
    return path;
}

function parsePayload(event) {
    if (!event.data) return { title: DEFAULT_TITLE, body: '', data: {} };
    try {
        const json = event.data.json();
        if (json && typeof json === 'object') return json;
    } catch (e) {
        // не JSON — покажем текст как тело
    }
    let text = '';
    try {
        text = event.data.text();
    } catch (e) {
        text = '';
    }
    return { title: DEFAULT_TITLE, body: text || '', data: {} };
}

function isSameOrigin(url) {
    try {
        return new URL(url).origin === self.location.origin;
    } catch (e) {
        return false;
    }
}

/* Видимая вкладка сайта (в фокусе или visibilityState === 'visible') — ей отдаём пуш как тост. */
function findVisibleClient() {
    return self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
        const own = clients.filter((c) => isSameOrigin(c.url));
        return own.find((c) => c.focused === true) || own.find((c) => c.visibilityState === 'visible') || null;
    });
}

function showPush(payload) {
    const data = payload.data && typeof payload.data === 'object' ? payload.data : {};
    const title = typeof payload.title === 'string' && payload.title ? payload.title : DEFAULT_TITLE;
    const options = {
        body: typeof payload.body === 'string' ? payload.body : '',
        icon: resolveIcon(payload.icon, DEFAULT_ICON),
        badge: resolveIcon(payload.badge, undefined),
        tag: typeof payload.tag === 'string' && payload.tag ? payload.tag : undefined,
        renotify: Boolean(payload.renotify),
        data: data,
    };
    if (!options.badge) delete options.badge;
    if (!options.tag) {
        delete options.tag;
        delete options.renotify;
    }
    return self.registration.showNotification(title, options);
}

self.addEventListener('push', (event) => {
    const payload = parsePayload(event);
    event.waitUntil(
        findVisibleClient()
            .then((client) => {
                if (client) {
                    // вкладка видна — страница покажет тост (NotificationsBridge), системный баннер не нужен
                    client.postMessage({ type: 'notification-push', data: payload });
                    return undefined;
                }
                return showPush(payload);
            })
            .catch(() => showPush(payload)),
    );
});

/* Маршрут уведомления → URL сайта (маршруты ЛК: /profile/my-orders/[order_id], /profile/support-chat, /profile/notifications). */
function routeToUrl(data) {
    const route = data && typeof data.route === 'string' ? data.route : '';
    const orderId = data && data.orderId != null ? String(data.orderId) : '';
    switch (route) {
        case 'order':
        case 'documents':
        case 'order_request':
            return orderId ? '/profile/my-orders/' + encodeURIComponent(orderId) : '/profile/my-orders';
        case 'orders':
            return '/profile/my-orders';
        case 'support_chat':
            return '/profile/support-chat';
        case 'notifications':
        case 'account':
            return '/profile/notifications';
        case 'search':
            return '/search';
        case 'url':
            return safeExternalUrl(data.url) || '/';
        case 'home':
        default:
            return '/';
    }
}

function safeExternalUrl(value) {
    if (typeof value !== 'string' || !value) return null;
    try {
        const url = new URL(value, self.location.origin);
        if (url.protocol !== 'https:' && url.protocol !== 'http:') return null;
        if (url.origin === self.location.origin) return url.href;
        if (ALLOWED_HOSTS.indexOf(url.hostname) !== -1) return url.href;
        return null;
    } catch (e) {
        return null;
    }
}

/* ?nid=<id> добавляем только для URL своего origin (внешние ссылки не трогаем). */
function withNotificationId(url, data) {
    const id = data && data.notificationId != null ? String(data.notificationId) : '';
    if (!id) return url;
    try {
        const u = new URL(url, self.location.origin);
        if (u.origin !== self.location.origin) return url;
        u.searchParams.set('nid', id);
        return u.href;
    } catch (e) {
        return url;
    }
}

self.addEventListener('notificationclick', (event) => {
    const notification = event.notification;
    notification.close();
    const data = notification.data && typeof notification.data === 'object' ? notification.data : {};
    const path = routeToUrl(data);
    const targetUrl = new URL(path, self.location.origin).href;
    const message = { type: 'notification-click', data: data, url: targetUrl };

    event.waitUntil(
        self.clients
            .matchAll({ type: 'window', includeUncontrolled: true })
            .then((clients) => {
                const sameOrigin = clients.filter((c) => isSameOrigin(c.url));
                const client = sameOrigin.find((c) => c.focused) || sameOrigin[0];
                if (client) {
                    const focusPromise = 'focus' in client ? client.focus() : Promise.resolve(client);
                    return focusPromise.then((focused) => {
                        const target = focused || client;
                        // страница сама сделает router.push и POST /api/notifications/opened
                        target.postMessage(message);
                        return target;
                    });
                }
                // вкладок нет — открываем новую; id уведомления передаём через ?nid=, страница отметит «открыто»
                return self.clients.openWindow(withNotificationId(targetUrl, data));
            })
            .catch(() => self.clients.openWindow(targetUrl)),
    );
});

/* Браузер сменил подписку — переподписываемся с тем же VAPID-ключом и отдаём странице для POST /api/push/devices. */
self.addEventListener('pushsubscriptionchange', (event) => {
    const oldSub = event.oldSubscription;
    const newSub = event.newSubscription;
    const key =
        (newSub && newSub.options && newSub.options.applicationServerKey) ||
        (oldSub && oldSub.options && oldSub.options.applicationServerKey) ||
        null;
    if (!key) return;
    event.waitUntil(
        self.registration.pushManager
            .subscribe({ userVisibleOnly: true, applicationServerKey: key })
            .then((subscription) => broadcast({ type: 'push-resubscribed', subscription: subscription.toJSON() }))
            .catch(() => undefined),
    );
});

function broadcast(message) {
    return self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
        clients.forEach((client) => {
            try {
                client.postMessage(message);
            } catch (e) {
                // ignore
            }
        });
    });
}
