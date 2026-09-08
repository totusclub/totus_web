import PushEnableCard from './PushEnableCard';
import styles from './notifications.module.css';

interface NotificationsEmptyProps {
    /** Пусто из-за фильтра (карточку push не показываем) */
    filtered?: boolean;
}

export default function NotificationsEmpty({ filtered = false }: NotificationsEmptyProps) {
    return (
        <div className={styles.empty}>
            <span className={styles.emptyIcon}>
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#FE732E" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                    <path d="M6 16V11a6 6 0 0 1 12 0v5l1.5 2h-15L6 16Z" />
                    <path d="M10 20a2 2 0 0 0 4 0" />
                </svg>
            </span>
            <p className={styles.emptyTitle}>{filtered ? 'В этой категории пока пусто' : 'Уведомлений пока нет'}</p>
            <p className={styles.emptyText}>
                {filtered
                    ? 'Попробуйте выбрать другой фильтр'
                    : 'Здесь появятся сообщения о заказах, оплате, документах и напоминания о поездке'}
            </p>
            {!filtered ? <PushEnableCard /> : null}
        </div>
    );
}
