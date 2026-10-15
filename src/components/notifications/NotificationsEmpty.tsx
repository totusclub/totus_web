import PushEnableCard from './PushEnableCard';
import styles from './notifications.module.css';
import TotusIcon from '@/components/icons/totus/TotusIcon';
import { iconBell } from '@/components/icons/totus/icons.generated';

interface NotificationsEmptyProps {
    /** Пусто из-за фильтра (карточку push не показываем) */
    filtered?: boolean;
}

export default function NotificationsEmpty({ filtered = false }: NotificationsEmptyProps) {
    return (
        <div className={styles.empty}>
            <span className={styles.emptyIcon}>
                <TotusIcon icon={iconBell} size={32} color="#FE732E" accent={false} />
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
