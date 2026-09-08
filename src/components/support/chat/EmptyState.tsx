import Icon from '@/components/icons/Icon';
import QuickTopics from './QuickTopics';
import styles from './supportChat.module.css';

export const DEFAULT_HOURS_TEXT =
    'Служба поддержки Totus Club отвечает ежедневно с 9:00 до 21:00 (МСК). Среднее время ответа — 5 минут.';

type EmptyStateProps = {
    hoursText?: string | null;
    onSelectTopic: (topic: string) => void;
};

/** Пустое состояние (первое открытие): аватар, «Напишите нам», часы работы из API, чипы тем. */
export default function EmptyState({ hoursText, onSelectTopic }: EmptyStateProps) {
    return (
        <div className={styles.empty}>
            <div className={styles.emptyAvatar} aria-hidden>
                <Icon name="bird" size={40} />
            </div>
            <p className={styles.emptyTitle}>Напишите нам</p>
            <p className={styles.emptyText}>{hoursText || DEFAULT_HOURS_TEXT}</p>
            <QuickTopics onSelect={onSelectTopic} className={styles.emptyChips} />
        </div>
    );
}
