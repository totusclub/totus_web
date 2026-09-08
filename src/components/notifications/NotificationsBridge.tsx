import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/router';
import { useDispatch } from 'react-redux';
import useAuth from '@/hooks/useAuth';
import { AUTH_LOGOUT_EVENT } from '@/api/http';
import type { NotificationEvent } from '@/api/notificationsApi';
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

    useEffect(() => {
        setMounted(true);
    }, []);

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
            dispatch(addIncoming(payload));
            if (typeof document === 'undefined' || document.visibilityState !== 'visible') {
                // вкладка скрыта — системное уведомление покажет push
                return;
            }
            setToasts((prev) => {
                if (prev.some((toast) => toast.id === payload.id)) return prev;
                return [...prev, payload].slice(-MAX_TOASTS);
            });
        });

        const offBadge = onSupportEvent<{ unread?: number }>('notify:badge', (payload) => {
            if (payload && typeof payload.unread === 'number') dispatch(setUnread(payload.unread));
        });

        return () => {
            offNew();
            offBadge();
        };
    }, [mounted, user, token, dispatch]);

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
            }
        });
    }, [mounted, token, openNotification]);

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
