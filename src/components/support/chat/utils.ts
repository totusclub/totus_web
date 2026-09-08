import type { SupportChatMessage } from '@/store/slices/supportChatSlice';

const MONTHS_RU = [
    'января', 'февраля', 'марта', 'апреля', 'мая', 'июня',
    'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря',
];

function toDate(value: string | number | Date | null | undefined): Date | null {
    if (!value) return null;
    const date = value instanceof Date ? value : new Date(value);
    return Number.isNaN(date.getTime()) ? null : date;
}

/** Ключ дня (локальное время) для группировки сообщений. */
export function dayKey(value: string | number | Date | null | undefined): string {
    const date = toDate(value);
    if (!date) return '';
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
}

/** «Сегодня» / «Вчера» / «7 сентября» / «7 сентября 2025». */
export function formatDateDivider(value: string | number | Date | null | undefined, now: Date = new Date()): string {
    const date = toDate(value);
    if (!date) return '';
    const key = dayKey(date);
    if (key === dayKey(now)) return 'Сегодня';
    const yesterday = new Date(now);
    yesterday.setDate(now.getDate() - 1);
    if (key === dayKey(yesterday)) return 'Вчера';
    const base = `${date.getDate()} ${MONTHS_RU[date.getMonth()]}`;
    return date.getFullYear() === now.getFullYear() ? base : `${base} ${date.getFullYear()}`;
}

/** Время сообщения «14:05». */
export function formatMessageTime(value: string | number | Date | null | undefined): string {
    const date = toDate(value);
    if (!date) return '';
    const h = String(date.getHours()).padStart(2, '0');
    const m = String(date.getMinutes()).padStart(2, '0');
    return `${h}:${m}`;
}

export interface MessageGroup {
    key: string;
    label: string;
    messages: SupportChatMessage[];
}

/** Группировка ленты по дням (лента уже отсортирована по возрастанию). */
export function groupMessagesByDate(messages: SupportChatMessage[], now: Date = new Date()): MessageGroup[] {
    const groups: MessageGroup[] = [];
    for (const message of messages) {
        const key = dayKey(message.createdAt) || 'unknown';
        const last = groups[groups.length - 1];
        if (last && last.key === key) {
            last.messages.push(message);
        } else {
            groups.push({ key, label: formatDateDivider(message.createdAt, now), messages: [message] });
        }
    }
    return groups;
}

/** Имя отправителя со стороны поддержки: «Анна · Поддержка Totus». */
export function formatSenderName(message: SupportChatMessage): string {
    const name = (message.senderName || '').trim();
    if (message.senderRole === 'system') return 'Totus';
    return name ? `${name} · Поддержка Totus` : 'Поддержка Totus';
}

export function isOwnMessage(message: SupportChatMessage): boolean {
    return message.senderRole === 'user';
}
