import styles from './supportChat.module.css';

export const QUICK_TOPICS: string[] = [
    'Вопрос по заказу',
    'Изменить бронирование',
    'Проблема с оплатой',
    'Документы по туру',
];

type QuickTopicsProps = {
    onSelect: (topic: string) => void;
    disabled?: boolean;
    className?: string;
};

/** Чипы быстрых тем — подставляют текст в поле ввода. */
export default function QuickTopics({ onSelect, disabled, className }: QuickTopicsProps) {
    return (
        <div className={`${styles.chips} ${className || ''}`}>
            {QUICK_TOPICS.map((topic) => (
                <button
                    key={topic}
                    type="button"
                    className={styles.chip}
                    disabled={disabled}
                    onClick={() => onSelect(topic)}
                >
                    {topic}
                </button>
            ))}
        </div>
    );
}
