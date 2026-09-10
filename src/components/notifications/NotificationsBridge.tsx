import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/router';
import { useDispatch } from 'react-redux';
import useAuth from '@/hooks/useAuth';
import { AUTH_LOGOUT_EVENT } from '@/api/http';
import { categoryForType, type NotificationData, type NotificationEvent } from '@/api/notificationsApi';
import { onSupportEvent } from '@/lib/supportSocket';
import {
    isWebPushSupported,
    listenServiceWorkerMessages,
    registerServiceWorker,
    registerSubscription,
    syncWebPushSubscription,
} from '@/lib/webPush';
import { addIncoming, fetchUnread, markNotificationOpened, reset, setUnread } from '@/store/slices/notificationsSlice';
import type { AppDispatch } from '@/store';
import { NotificationToastStack } from './NotificationToast';
import { useOpenNotification } from './useOpenNotification';

const MAX_TOASTS = 3;
const SEEN_LIMIT = 200;

/**
 * Глобальный «мост» уведомлений (рядом с SupportChatGate в _app.tsx):
 * - после входа тянет счётчик непрочитанных и слушает notify:new / notify:badge на общем сокете voip
 *   (сокет создаёт/держит SupportChatGate; onSupportEvent подключает его при необходимости);
 * - при notify:new и видимой вкладке — тост в углу; при скрытой — ничего (пуш покажет система);
 * - регистрирует service worker и, если подписка уже есть в браузере, привязывает её к текущему
 *   пользователю (POST /api/push/devices). Разрешение на уведомления НЕ запрашивает;
 * - принимает сообщения sw.js: клик по системному уведомлению → markOpened + router.push,
 *   переподписка → POST /api/push/devices; ?nid= в URL (вкладка открыта из пуша) → markOpened.
 */
export default function NotificationsBridge() {
    const { user, token } = useAuth();
    const dispatch = useDispatch<AppDispatch>();
    const router = useRouter();
    const openNotification = useOpenNotification();
    const [mounted, setMounted] = useState(false);
    const [toasts, setToasts] = useState<NotificationEvent[]>([]);
    const syncedForRef = useRef<string | number | null>(null);
    /** id уже показанных уведомлений — дедуп notify:new (сокет) и notification-push (sw.js) */
    const seenRef = useRef<Set<number>>(new Set());

    useEffect(() => {
        setMounted(true);
    }, []);

    const markSeen = useCallback((id: number): boolean => {
        const seen = seenRef.current;
        if (seen.has(id)) return false;
        seen.add(id);
        if (seen.size > SEEN_LIMIT) {
            const first = seen.values().next().value;
            if (typeof first === 'number') seen.delete(first);
        }
        return true;
    }, []);

    /** Новое уведомление (сокет или пуш при видимой вкладке): в Redux + тост, если вкладка видна. */
    const handleIncoming = useCallback(
        (event: NotificationEvent) => {
            if (!markSeen(event.id)) return;
            dispatch(addIncoming(event));
            if (typeof document === 'undefined' || document.visibilityState !== 'visible') {
                // вкладка скрыта — системное уведомление покажет push
                return;
            }
            setToasts((prev) => {
                if (prev.some((toast) => toast.id === event.id)) return prev;
                return [...prev, event].slice(-MAX_TOASTS);
            });
        },
        [dispatch, markSeen],
    );

    const closeToast = useCallback((id: number) => {
        setToasts((prev) => prev.filter((toast) => toast.id !== id));
    }, []);

    const openToast = useCallback(
        (notification: NotificationEvent) => {
            closeToast(notification.id);
            openNotification(notification.id, notification.data ?? null);
        },
        [closeToast, openNotification],
    );

    // Счётчик непрочитанных при входе / после hydrate
    useEffect(() => {
        if (!mounted || !user || !token) return;
        dispatch(fetchUnread());
    }, [mounted, user, token, dispatch]);

    // Socket: notify:new / notify:badge
    useEffect(() => {
        if (!mounted || !user || !token) return;

        const offNew = onSupportEvent<NotificationEvent>('notify:new', (payload) => {
            if (!payload || typeof payload.id !== 'number') return;
            handleIncoming(payload);
        });

        const offBadge = onSupportEvent<{ unread?: number }>('notify:badge', (payload) => {
            if (payload && typeof payload.unread === 'number') dispatch(setUnread(payload.unread));
        });

        return () => {
            offNew();
            offBadge();
        };
    }, [mounted, user, token, dispatch, handleIncoming]);

    // Service worker: регистрация (без подписки) + привязка существующей подписки к пользователю
    useEffect(() => {
        if (!mounted || !user || !token || !isWebPushSupported()) return;
        const userKey = (user as { id?: string | number; loyalty_id?: string | number })?.id
            ?? (user as { loyalty_id?: string | number })?.loyalty_id
            ?? 'user';
        if (syncedForRef.current === userKey) return;
        syncedForRef.current = userKey;
        let cancelled = false;
        registerServiceWorker()
            .then(() => (cancelled ? false : syncWebPushSubscription()))
            .catch(() => undefined);
        return () => {
            cancelled = true;
        };
    }, [mounted, user, token]);

    // Сообщения от sw.js
    useEffect(() => {
        if (!mounted) return;
        return listenServiceWorkerMessages((message) => {
            if (message.type === 'notification-click') {
                const data = message.data || {};
                const rawId = data.notificationId;
                const id = rawId != null && rawId !== '' ? Number(rawId) : NaN;
                openNotification(Number.isFinite(id) ? id : null, data);
                return;
            }
            if (message.type === 'push-resubscribed' && message.subscription && token) {
                registerSubscription(message.subscription).catch(() => undefined);
                return;
            }
            if (message.type === 'notification-push' && token) {
                // пуш при видимой вкладке: sw.js не показал баннер — показываем тост (дедуп с notify:new по id)
                const payload = message.data || {};
                const data = (payload.data && typeof payload.data === 'object' ? payload.data : {}) as NotificationData;
                const id = data.notificationId != null && data.notificationId !== '' ? Number(data.notificationId) : NaN;
                if (!Number.isFinite(id)) return;
                const type = typeof data.type === 'string' ? data.type : 'system';
                handleIncoming({
                    id,
                    type,
                    category: categoryForType(type),
                    title: typeof payload.title === 'string' ? payload.title : 'Totus Club',
                    body: typeof payload.body === 'string' ? payload.body : '',
                    data,
                    createdAt: new Date().toISOString(),
                });
            }
        });
    }, [mounted, token, openNotification, handleIncoming]);

    // Вкладка открыта из системного уведомления (?nid=) → отметить «открыто», убрать параметр из URL
    useEffect(() => {
        if (!mounted || !router.isReady || !token) return;
        const raw = router.query.nid;
        const value = Array.isArray(raw) ? raw[0] : raw;
        if (!value) return;
        const id = Number(value);
        if (Number.isFinite(id)) {
            dispatch(markNotificationOpened(id));
        }
        const rest = { ...router.query };
        delete rest.nid;
        router.replace({ pathname: router.pathname, query: rest }, undefined, { shallow: true });
    }, [mounted, router.isReady, router.query.nid, token]); // eslint-disable-line react-hooks/exhaustive-deps

    // Logout → сброс состояния
    useEffect(() => {
        if (!mounted) return;
        const onLogout = () => {
            syncedForRef.current = null;
            seenRef.current = new Set();
            setToasts([]);
            dispatch(reset());
        };
        window.addEventListener(AUTH_LOGOUT_EVENT, onLogout);
        return () => window.removeEventListener(AUTH_LOGOUT_EVENT, onLogout);
    }, [mounted, dispatch]);

    useEffect(() => {
        if (!mounted) return;
        if (!user || !token) {
            syncedForRef.current = null;
            setToasts([]);
            dispatch(reset());
        }
    }, [mounted, user, token, dispatch]);

    return <NotificationToastStack toasts={toasts} onOpen={openToast} onClose={closeToast} />;
}
