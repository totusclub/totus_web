import type { NotificationCategory, NotificationType } from '@/api/notificationsApi';
import styles from './notifications.module.css';
import TotusIcon from '@/components/icons/totus/TotusIcon';
import {
    iconBell,
    iconChat,
    iconDocVoucher,
    iconInfo,
    iconNMissedCall,
    iconNOrder,
    iconNPayment,
    iconNPromo,
    iconNReminder,
    type TotusIconDef,
} from '@/components/icons/totus/icons.generated';

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

/** Глиф — из набора Totus, одним цветом категории (без оранжевой детали). */
const GLYPHS: Record<CategoryIconKind, TotusIconDef> = {
    order: iconNOrder,
    payment: iconNPayment,
    document: iconDocVoucher,
    chat: iconChat,
    call: iconNMissedCall,
    plane: iconNReminder,
    tag: iconNPromo,
    bell: iconBell,
    info: iconInfo,
};

function Glyph({ kind, color }: { kind: CategoryIconKind; color: string }) {
    return <TotusIcon icon={GLYPHS[kind] ?? iconInfo} size={20} color={color} accent={false} />;
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
