import Link from 'next/link';
import type { SupportChatMessage } from '@/store/slices/supportChatSlice';
import { formatMessageTime, formatSenderName, isOwnMessage } from './utils';
import styles from './supportChat.module.css';

type MessageItemProps = {
    message: SupportChatMessage;
    /** Скрыть имя отправителя (соседнее сообщение того же автора) */
    compact?: boolean;
    onRetry?: (message: SupportChatMessage) => void;
    onRemove?: (message: SupportChatMessage) => void;
};

function DoubleCheck({ read }: { read: boolean }) {
    return (
        <svg
            className={`${styles.check} ${read ? styles.checkRead : ''}`}
            width="16"
            height="10"
            viewBox="0 0 16 10"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            aria-label={read ? 'Прочитано' : 'Отправлено'}
        >
            <path d="M1 5.2L4.2 8.4L10 1.6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            {read ? (
                <path d="M6.4 6.4L8.2 8.4L15 1.6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            ) : null}
        </svg>
    );
}

function OrderCard({ message }: { message: SupportChatMessage }) {
    const meta = message.meta;
    if (!meta?.orderId) return null;
    const orderId = String(meta.orderId);
    const title = meta.orderTitle || `Заказ № ${orderId}`;
    return (
        <Link href={`/profile/my-orders/${encodeURIComponent(orderId)}`} className={styles.orderCard}>
            <span className={styles.orderCardTitle}>{title}</span>
            {meta.orderSubtitle ? <span className={styles.orderCardSubtitle}>{meta.orderSubtitle}</span> : null}
            <span className={styles.orderCardLink}>Открыть заказ →</span>
        </Link>
    );
}

export default function MessageItem({ message, compact, onRetry, onRemove }: MessageItemProps) {
    const own = isOwnMessage(message);
    const system = message.senderRole === 'system';

    if (system) {
        return (
            <div className={styles.systemRow}>
                <span className={styles.systemBubble}>{message.body}</span>
            </div>
        );
    }

    return (
        <div className={`${styles.row} ${own ? styles.rowOwn : styles.rowIn}`}>
            <div
                className={`${styles.bubble} ${own ? styles.bubbleOwn : styles.bubbleIn} ${message.failed ? styles.bubbleFailed : ''} ${message.pending ? styles.bubblePending : ''}`}
            >
                {!own && !compact ? <p className={styles.sender}>{formatSenderName(message)}</p> : null}
                <OrderCard message={message} />
                {message.body ? <p className={styles.body}>{message.body}</p> : null}
                <span className={styles.metaRow}>
                    <span className={styles.time}>{formatMessageTime(message.createdAt)}</span>
                    {own && !message.failed ? (
                        message.pending ? (
                            <span className={styles.pendingDot} aria-label="Отправляется" />
                        ) : (
                            <DoubleCheck read={Boolean(message.readAt)} />
                        )
                    ) : null}
                </span>
            </div>
            {message.failed ? (
                <div className={styles.failedRow}>
                    <span className={styles.failedText}>{message.error || 'Не отправлено'}</span>
                    {onRetry ? (
                        <button type="button" className={styles.failedBtn} onClick={() => onRetry(message)}>
                            Повторить
                        </button>
                    ) : null}
                    {onRemove ? (
                        <button type="button" className={styles.failedBtn} onClick={() => onRemove(message)}>
                            Удалить
                        </button>
                    ) : null}
                </div>
            ) : null}
        </div>
    );
}
