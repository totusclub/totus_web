import type { CSSProperties } from 'react';
import type { TotusIconDef } from './icons.generated';

/**
 * Иконка Totus (стиль C): линия 1,5, скруглённые концы, одна оранжевая деталь.
 *
 * Цвет линии — `var(--icon-ink)`, по умолчанию currentColor (берёт цвет текста и темы).
 * Цвет детали — `var(--icon-accent)`, по умолчанию фирменный #FE732E.
 * Переопределить можно через CSS-переменные у родителя или пропсы `color` / `accentColor`.
 *
 *   import TotusIcon from '@/components/icons/totus/TotusIcon';
 *   import { iconSearch } from '@/components/icons/totus/icons.generated';
 *   <TotusIcon icon={iconSearch} size={20} />
 */
export interface TotusIconProps {
    icon: TotusIconDef;
    size?: number | string;
    /** Цвет линии. По умолчанию — currentColor через --icon-ink. */
    color?: string;
    /** Цвет оранжевой детали. По умолчанию — #FE732E через --icon-accent. */
    accentColor?: string;
    /** false — иконка одним цветом, без оранжевой детали (например, на оранжевой кнопке). */
    accent?: boolean;
    /** true — залить контуры их же цветом (например, звёзды отеля). */
    filled?: boolean;
    /** Текст для скринридера. Без него иконка считается декоративной. */
    title?: string;
    className?: string;
    style?: CSSProperties;
    onClick?: () => void;
}

export const TOTUS_ICON_INK = 'var(--icon-ink, currentColor)';
export const TOTUS_ICON_ACCENT = 'var(--icon-accent, #FE732E)';

export default function TotusIcon({
    icon,
    size = 24,
    color,
    accentColor,
    accent = true,
    filled = false,
    title,
    className,
    style,
    onClick,
}: TotusIconProps) {
    const ink = color ?? TOTUS_ICON_INK;
    const acc = accent ? accentColor ?? TOTUS_ICON_ACCENT : ink;
    return (
        <svg
            width={size}
            height={size}
            viewBox="0 0 24 24"
            fill="none"
            strokeWidth={1.5}
            strokeLinecap="round"
            strokeLinejoin="round"
            className={className}
            style={style}
            onClick={onClick}
            role={title ? 'img' : undefined}
            aria-hidden={title ? undefined : true}
            aria-label={title}
            focusable="false"
        >
            {icon.p.map((d, i) => {
                const c = icon.f ? acc : icon.a.includes(i) ? acc : ink;
                return <path key={i} d={d} stroke={c} fill={icon.f || filled ? c : undefined} />;
            })}
        </svg>
    );
}
