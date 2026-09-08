import { useEffect } from 'react';
import type { NotificationEvent } from '@/api/notificationsApi';
import CategoryIcon from './CategoryIcon';
import styles from './notifications.module.css';

export const TOAST_DURATION_MS = 5000;

interface NotificationToastProps {
    notification: NotificationEvent;
    onOpen: (notification: NotificationEvent) => void;
    onClose: (id: number) => void;
}

/** Тост в углу при видимой вкладке (notify:new): 5 с, клик → маршрут уведомления. */
export default function NotificationToast({ notification, onOpen, onClose }: NotificationToastProps) {
    useEffect(() => {
        const timer = window.setTimeout(() => onClose(notification.id), TOAST_DURATION_MS);
        return () => window.clearTimeout(timer);
    }, [notification.id, onClose]);

    return (
        <div
            role="status"
            className={styles.toast}
            onClick={() => onOpen(notification)}
        >
            <CategoryIcon category={notification.category} type={notification.type} size={36} />
            <div className={styles.toastBody}>
                <p className={styles.toastTitle}>{notification.title}</p>
                {notification.body ? <p className={styles.toastText}>{notification.body}</p> : null}
            </div>
            <button
                type="button"
                className={styles.toastClose}
                aria-label="Закрыть"
                onClick={(event) => {
                    event.stopPropagation();
                    onClose(notification.id);
                }}
            >
                ×
            </button>
        </div>
    );
}

interface NotificationToastStackProps {
    toasts: NotificationEvent[];
    onOpen: (notification: NotificationEvent) => void;
    onClose: (id: number) => void;
}

export function NotificationToastStack({ toasts, onOpen, onClose }: NotificationToastStackProps) {
    if (!toasts.length) return null;
    return (
        <div className={styles.toastStack} aria-live="polite">
            {toasts.map((toast) => (
                <NotificationToast key={toast.id} notification={toast} onOpen={onOpen} onClose={onClose} />
            ))}
        </div>
    );
}
