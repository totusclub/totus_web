import type { NotificationCategory, NotificationType } from '@/api/notificationsApi';
import styles from './notifications.module.css';

/**
 * Круглая иконка категории (DESIGN.md): заказы #FE732E (сумка), оплата #288556 (рубль),
 * документы и поддержка #2BA9E2 (документ / чат), напоминания #5856D6 (самолёт),
 * акции #FF9500 (ярлык), система серый (info). Подложка — 12 % того же цвета.
 */
export type CategoryIconKind = 'order' | 'payment' | 'document' | 'chat' | 'plane' | 'tag' | 'info' | 'bell' | 'call';

export const CATEGORY_COLORS: Record<CategoryIconKind, string> = {
    order: '#FE732E',
    payment: '#288556',
    document: '#2BA9E2',
    chat: '#2BA9E2',
    call: '#2BA9E2',
    plane: '#5856D6',
    tag: '#FF9500',
    info: '#8E8E93',
    bell: '#FE732E',
};

export function iconKindFor(category: NotificationCategory | string, type?: NotificationType | string): CategoryIconKind {
    if (type === 'payment_success' || type === 'payment_failed') return 'payment';
    if (type === 'missed_call') return 'call';
    if (type === 'documents_ready') return 'document';
    switch (category) {
        case 'orders':
            return 'order';
        case 'documents':
            return 'document';
        case 'reminders':
            return 'plane';
        case 'support':
            return 'chat';
        case 'promo':
            return 'tag';
        case 'system':
        default:
            return 'info';
    }
}

function hexToRgba(hex: string, alpha: number): string {
    const value = hex.replace('#', '');
    const r = parseInt(value.slice(0, 2), 16);
    const g = parseInt(value.slice(2, 4), 16);
    const b = parseInt(value.slice(4, 6), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function Glyph({ kind, color }: { kind: CategoryIconKind; color: string }) {
    const common = {
        width: 20,
        height: 20,
        viewBox: '0 0 24 24',
        fill: 'none',
        stroke: color,
        strokeWidth: 1.8,
        strokeLinecap: 'round' as const,
        strokeLinejoin: 'round' as const,
        'aria-hidden': true,
    };
    switch (kind) {
        case 'order':
            return (
                <svg {...common}>
                    <path d="M6 8h12l1 12H5L6 8Z" />
                    <path d="M9 8V6a3 3 0 0 1 6 0v2" />
                </svg>
            );
        case 'payment':
            return (
                <svg {...common}>
                    <path d="M9 19V5h5a3.5 3.5 0 0 1 0 7H9" />
                    <path d="M7 15h7" />
                </svg>
            );
        case 'document':
            return (
                <svg {...common}>
                    <path d="M7 3h7l5 5v13H7V3Z" />
                    <path d="M14 3v5h5" />
                    <path d="M10 13h6M10 17h6" />
                </svg>
            );
        case 'chat':
            return (
                <svg {...common}>
                    <path d="M4 6a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H9l-5 4V6Z" />
                    <path d="M8 9h8M8 12.5h5" />
                </svg>
            );
        case 'call':
            return (
                <svg {...common}>
                    <path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2Z" />
                </svg>
            );
        case 'plane':
            return (
                <svg {...common}>
                    <path d="M10.5 13.5 4 11l1.5-1.5 6 1 5-5a1.5 1.5 0 0 1 2 2l-5 5 1 6L13 20l-2.5-6.5Z" />
                </svg>
            );
        case 'tag':
            return (
                <svg {...common}>
                    <path d="M3 12V4h8l10 10-8 8L3 12Z" />
                    <circle cx="8" cy="9" r="1.5" />
                </svg>
            );
        case 'bell':
            return (
                <svg {...common}>
                    <path d="M6 16V11a6 6 0 0 1 12 0v5l1.5 2h-15L6 16Z" />
                    <path d="M10 20a2 2 0 0 0 4 0" />
                </svg>
            );
        case 'info':
        default:
            return (
                <svg {...common}>
                    <circle cx="12" cy="12" r="9" />
                    <path d="M12 11v5M12 8v.5" />
                </svg>
            );
    }
}

interface CategoryIconProps {
    category: NotificationCategory | string;
    type?: NotificationType | string;
    kind?: CategoryIconKind;
    size?: number;
    className?: string;
}

export default function CategoryIcon({ category, type, kind, size = 40, className }: CategoryIconProps) {
    const resolved = kind ?? iconKindFor(category, type);
    const color = CATEGORY_COLORS[resolved];
    return (
        <span
            className={`${styles.catIcon} ${className || ''}`}
            style={{ width: size, height: size, background: hexToRgba(color, 0.12) }}
        >
            <Glyph kind={resolved} color={color} />
        </span>
    );
}
