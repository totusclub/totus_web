import type { MouseEvent } from 'react';
import type { NotificationItem as NotificationItemModel } from '@/api/notificationsApi';
import CategoryIcon from './CategoryIcon';
import { formatNotificationTime } from './dates';
import styles from './notifications.module.css';
import TotusIcon from '@/components/icons/totus/TotusIcon';
import { iconClose } from '@/components/icons/totus/icons.generated';

interface NotificationItemProps {
    item: NotificationItemModel;
    onOpen: (item: NotificationItemModel) => void;
    onDelete?: (item: NotificationItemModel) => void;
    /** Компактный вариант для поповера в шапке: текст в одну строку, без удаления */
    compact?: boolean;
}

export default function NotificationItem({ item, onOpen, onDelete, compact = false }: NotificationItemProps) {
    const unread = !item.readAt;

    const handleDelete = (event: MouseEvent<HTMLButtonElement>) => {
        event.stopPropagation();
        event.preventDefault();
        onDelete?.(item);
    };

    return (
        <div
            role="button"
            tabIndex={0}
            className={`${styles.item} ${unread ? styles.itemUnread : ''}`}
            onClick={() => onOpen(item)}
            onKeyDown={(event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault();
                    onOpen(item);
                }
            }}
            aria-label={`${item.title}${unread ? ' (непрочитанное)' : ''}`}
        >
            <CategoryIcon category={item.category} type={item.type} size={compact ? 36 : 40} />
            <div className={styles.itemBody}>
                <div className={styles.itemTitleRow}>
                    <p className={styles.itemTitle}>{item.title}</p>
                    {unread ? <span className={styles.itemDot} aria-hidden /> : null}
                </div>
                {item.body ? (
                    <p className={`${styles.itemText} ${compact ? styles.itemTextOneLine : ''}`}>{item.body}</p>
                ) : null}
            </div>
            <span className={styles.itemTime}>{formatNotificationTime(item.createdAt)}</span>
            {!compact && onDelete ? (
                <button type="button" className={styles.itemDelete} onClick={handleDelete} aria-label="Удалить уведомление">
                    <TotusIcon icon={iconClose} size={16} />
                </button>
            ) : null}
        </div>
    );
}
