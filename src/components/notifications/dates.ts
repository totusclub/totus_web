import type { NotificationItem } from '@/api/notificationsApi';

const MONTHS_SHORT_RU = ['янв', 'фев', 'мар', 'апр', 'мая', 'июн', 'июл', 'авг', 'сен', 'окт', 'ноя', 'дек'];

export type NotificationGroupKey = 'today' | 'yesterday' | 'earlier';

export const GROUP_LABELS: Record<NotificationGroupKey, string> = {
    today: 'Сегодня',
    yesterday: 'Вчера',
    earlier: 'Ранее',
};

function toDate(value: string | number | Date | null | undefined): Date | null {
    if (!value) return null;
    const date = value instanceof Date ? value : new Date(value);
    return Number.isNaN(date.getTime()) ? null : date;
}

function dayKey(date: Date): string {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
}

/** «Сегодня» / «Вчера» / «Ранее» по локальному времени. */
export function groupKeyFor(value: string | number | Date | null | undefined, now: Date = new Date()): NotificationGroupKey {
    const date = toDate(value);
    if (!date) return 'earlier';
    const key = dayKey(date);
    if (key === dayKey(now)) return 'today';
    const yesterday = new Date(now);
    yesterday.setDate(now.getDate() - 1);
    if (key === dayKey(yesterday)) return 'yesterday';
    return 'earlier';
}

/** Время справа у элемента: «14:05» (сегодня), «Вчера», «5 сен» (или «5 сен 2025» для прошлых лет). */
export function formatNotificationTime(value: string | number | Date | null | undefined, now: Date = new Date()): string {
    const date = toDate(value);
    if (!date) return '';
    const group = groupKeyFor(date, now);
    if (group === 'today') {
        const h = String(date.getHours()).padStart(2, '0');
        const m = String(date.getMinutes()).padStart(2, '0');
        return `${h}:${m}`;
    }
    if (group === 'yesterday') return 'Вчера';
    const base = `${date.getDate()} ${MONTHS_SHORT_RU[date.getMonth()]}`;
    return date.getFullYear() === now.getFullYear() ? base : `${base} ${date.getFullYear()}`;
}

export interface NotificationGroup {
    key: NotificationGroupKey;
    label: string;
    items: NotificationItem[];
}

/** Группировка списка (уже отсортирован по убыванию id/времени). */
export function groupNotifications(items: NotificationItem[], now: Date = new Date()): NotificationGroup[] {
    const groups: NotificationGroup[] = [];
    for (const item of items) {
        const key = groupKeyFor(item.createdAt, now);
        const last = groups[groups.length - 1];
        if (last && last.key === key) {
            last.items.push(item);
        } else {
            groups.push({ key, label: GROUP_LABELS[key], items: [item] });
        }
    }
    return groups;
}

/** «3 непрочитанных» / «1 непрочитанное» / «5 непрочитанных». */
export function formatUnreadLabel(count: number): string {
    const n = Math.abs(count) % 100;
    const n1 = n % 10;
    if (n > 10 && n < 20) return `${count} непрочитанных`;
    if (n1 === 1) return `${count} непрочитанное`;
    if (n1 >= 2 && n1 <= 4) return `${count} непрочитанных`;
    return `${count} непрочитанных`;
}
