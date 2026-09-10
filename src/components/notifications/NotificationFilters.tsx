import type { NotificationsFilter } from '@/store/slices/notificationsSlice';
import styles from './notifications.module.css';

export const FILTERS: { key: NotificationsFilter; label: string }[] = [
    { key: 'all', label: 'Все' },
    { key: 'orders', label: 'Заказы и оплата' },
    { key: 'documents', label: 'Документы' },
    { key: 'reminders', label: 'Напоминания' },
    { key: 'support', label: 'Поддержка' },
    { key: 'promo', label: 'Акции' },
];

interface NotificationFiltersProps {
    value: NotificationsFilter;
    onChange: (value: NotificationsFilter) => void;
}

export default function NotificationFilters({ value, onChange }: NotificationFiltersProps) {
    return (
        <div className={styles.filters} role="tablist" aria-label="Фильтр уведомлений">
            {FILTERS.map((filter) => (
                <button
                    key={filter.key}
                    type="button"
                    role="tab"
                    aria-selected={value === filter.key}
                    className={`${styles.chip} ${value === filter.key ? styles.chipActive : ''}`}
                    onClick={() => onChange(filter.key)}
                >
                    {filter.label}
                </button>
            ))}
        </div>
    );
}
