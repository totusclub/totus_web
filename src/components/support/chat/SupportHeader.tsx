import Icon from '@/components/icons/Icon';
import styles from './supportChat.module.css';

type SupportHeaderProps = {
    /** Телефон поддержки (tel:); если не задан — кнопка звонка не показывается */
    phone?: string | null;
};

/** Шапка чата: аватар поддержки, «Поддержка Totus», статус, кнопка звонка (опционально). */
export default function SupportHeader({ phone }: SupportHeaderProps) {
    return (
        <div className={styles.header}>
            <div className={styles.headerAvatar} aria-hidden>
                <Icon name="bird" size={26} />
                <span className={styles.headerOnlineDot} />
            </div>
            <div className={styles.headerText}>
                <p className={styles.headerTitle}>Поддержка Totus</p>
                <p className={styles.headerStatus}>Онлайн · отвечаем в течение 5 минут</p>
            </div>
            {phone ? (
                <a
                    className={styles.headerCall}
                    href={`tel:${phone.replace(/[^\d+]/g, '')}`}
                    aria-label="Позвонить в поддержку"
                    title="Позвонить"
                >
                    <Icon name="phone" size={18} color="var(--core_Orange)" />
                </a>
            ) : null}
        </div>
    );
}
