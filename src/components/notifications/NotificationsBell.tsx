import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useDispatch, useSelector } from 'react-redux';
import type { AppDispatch, RootState } from '@/store';
import { getNotifications, type NotificationItem as NotificationItemModel } from '@/api/notificationsApi';
import { markNotificationsRead, markReadLocal } from '@/store/slices/notificationsSlice';
import NotificationItem from './NotificationItem';
import { useOpenNotification } from './useOpenNotification';
import styles from './notifications.module.css';

export const NOTIFICATIONS_PATH = '/profile/notifications';

function BellGlyph({ size = 22 }: { size?: number }) {
    return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <path d="M6 16V11a6 6 0 0 1 12 0v5l1.5 2h-15L6 16Z" />
            <path d="M10 20a2 2 0 0 0 4 0" />
        </svg>
    );
}

function formatBadge(count: number): string {
    return count > 99 ? '99+' : String(count);
}

/**
 * Колокольчик в шапке (только для авторизованных): бейдж непрочитанных, клик → поповер
 * с последними 3 уведомлениями, «Прочитать все» и ссылкой «Все уведомления».
 */
interface NotificationsBellProps {
    /** 'popover' — кнопка с поповером (desktop-шапка); 'link' — просто ссылка (mobile-шапка) */
    variant?: 'popover' | 'link';
}

export default function NotificationsBell({ variant = 'popover' }: NotificationsBellProps) {
    const router = useRouter();
    const dispatch = useDispatch<AppDispatch>();
    const unread = useSelector((state: RootState) => state.notifications?.unread ?? 0);
    const storeItems = useSelector((state: RootState) => state.notifications?.items ?? []);
    const [open, setOpen] = useState(false);
    const [items, setItems] = useState<NotificationItemModel[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const rootRef = useRef<HTMLDivElement>(null);
    const openNotification = useOpenNotification();

    // Загрузка последних 3 при открытии поповера
    useEffect(() => {
        if (!open) return;
        let cancelled = false;
        setLoading(true);
        setError(null);
        getNotifications({ limit: 3 })
            .then((data) => {
                if (!cancelled) setItems(data.items.slice(0, 3));
            })
            .catch((err: Error) => {
                if (!cancelled) setError(err?.message || 'Уведомления временно недоступны');
            })
            .finally(() => {
                if (!cancelled) setLoading(false);
            });
        return () => {
            cancelled = true;
        };
    }, [open]);

    // Синхронизация с Redux (прочитано / пришло новое)
    useEffect(() => {
        if (!open || !storeItems.length) return;
        setItems((prev) =>
            prev.map((item) => {
                const fresh = storeItems.find((s) => s.id === item.id);
                return fresh ? { ...item, readAt: fresh.readAt, openedAt: fresh.openedAt } : item;
            }),
        );
    }, [open, storeItems]);

    useEffect(() => {
        if (!open) return;
        const onPointerDown = (event: MouseEvent) => {
            if (rootRef.current && !rootRef.current.contains(event.target as Node)) setOpen(false);
        };
        const onKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape') setOpen(false);
        };
        document.addEventListener('mousedown', onPointerDown);
        document.addEventListener('keydown', onKeyDown);
        return () => {
            document.removeEventListener('mousedown', onPointerDown);
            document.removeEventListener('keydown', onKeyDown);
        };
    }, [open]);

    useEffect(() => {
        const close = () => setOpen(false);
        router.events.on('routeChangeStart', close);
        return () => {
            router.events.off('routeChangeStart', close);
        };
    }, [router.events]);

    const handleReadAll = () => {
        dispatch(markReadLocal('all'));
        setItems((prev) => prev.map((item) => ({ ...item, readAt: item.readAt || new Date().toISOString() })));
        dispatch(markNotificationsRead('all'));
    };

    const handleOpen = (item: NotificationItemModel) => {
        setOpen(false);
        openNotification(item.id, item.data);
    };

    const badge = unread > 0 ? <span className={styles.bellBadge}>{formatBadge(unread)}</span> : null;

    if (variant === 'link') {
        // mobile: просто ссылка на страницу уведомлений
        return (
            <Link href={NOTIFICATIONS_PATH} className={styles.bellLinkM} aria-label="Уведомления">
                <BellGlyph size={24} />
                {badge}
            </Link>
        );
    }

    return (
        <>
            {/* desktop: кнопка + поповер */}
            <div ref={rootRef} className={styles.bellRoot}>
                <button
                    type="button"
                    className={`${styles.bellBtn} ${open ? styles.bellBtnOpen : ''}`}
                    onClick={() => setOpen((prev) => !prev)}
                    aria-haspopup="dialog"
                    aria-expanded={open}
                    aria-label={unread > 0 ? `Уведомления, непрочитанных: ${unread}` : 'Уведомления'}
                >
                    <BellGlyph />
                    {badge}
                </button>

                {open ? (
                    <div className={styles.popover} role="dialog" aria-label="Уведомления">
                        <div className={styles.popoverHead}>
                            <p className={styles.popoverTitle}>Уведомления</p>
                            <button type="button" className={styles.popoverAction} onClick={handleReadAll} disabled={unread === 0}>
                                Прочитать все
                            </button>
                        </div>
                        <div className={styles.popoverList}>
                            {loading && !items.length ? (
                                <p className={styles.popoverEmpty}>Загрузка…</p>
                            ) : error ? (
                                <p className={styles.popoverEmpty}>{error}</p>
                            ) : items.length ? (
                                items.map((item) => <NotificationItem key={item.id} item={item} onOpen={handleOpen} compact />)
                            ) : (
                                <p className={styles.popoverEmpty}>Уведомлений пока нет</p>
                            )}
                        </div>
                        <Link href={NOTIFICATIONS_PATH} className={styles.popoverFooter}>
                            Все уведомления
                        </Link>
                    </div>
                ) : null}
            </div>
        </>
    );
}
