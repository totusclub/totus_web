import TotusIcon, { type TotusIconProps } from './TotusIcon';
import { HOTEL_ICONS } from './hotelIcons.generated';
import type { TotusIconKey } from './registry.generated';

/**
 * Иконка по ключу для поиска, страницы отеля и номеров — из подмножества HOTEL_ICONS
 * (ключ обычно приходит из ltIcons: mealIcon, hotelTypeIcon, amenityTextIcon…).
 * Ключа нет в подмножестве — ничего не рисуем.
 */
export interface HotelIconProps extends Omit<TotusIconProps, 'icon'> {
    name: TotusIconKey | null | undefined;
}

export default function HotelIcon({ name, ...rest }: HotelIconProps) {
    const icon = name ? HOTEL_ICONS[name] : undefined;
    if (!icon) return null;
    return <TotusIcon icon={icon} {...rest} />;
}
