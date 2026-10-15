import type { FaqIcon } from '@/config/faqContent';
import TotusIcon from '@/components/icons/totus/TotusIcon';
import * as T from '@/components/icons/totus/icons.generated';
import type { TotusIconDef } from '@/components/icons/totus/icons.generated';

/*
 * Иконки центра помощи и страницы «Партнёрам» — из набора Totus (стиль C, components/icons/totus).
 * Одно и то же имя в разных местах значит разное, поэтому иконка выбирается по месту (`place`):
 *  - section — плитки разделов «Частых вопросов» (faqContent.ts);
 *  - contact — карточки «Связаться с нами»;
 *  - partner — белые иконки на оранжевых кругах страницы «Партнёрам» (без оранжевой детали).
 */
type Name = FaqIcon | 'search' | 'chat' | 'chevron' | 'megaphone' | 'check';

const SECTION: Record<Name, TotusIconDef> = {
    sun: T.iconHelpTours,
    hotel: T.iconHelpHotels,
    plane: T.iconHelpFlights,
    card: T.iconHelpPayment,
    file: T.iconHelpOrders,
    refresh: T.iconHelpRefund,
    luggage: T.iconHelpTrip,
    sparkle: T.iconHelpMila,
    phone: T.iconHelpSupport,
    user: T.iconHelpAccount,
    smartphone: T.iconHelpApps,
    shield: T.iconHelpSecurity,
    search: T.iconSearch,
    chat: T.iconChat,
    chevron: T.iconChevronDown,
    check: T.iconCheck,
    megaphone: T.iconPAdvertisers,
};
const CONTACT: Partial<Record<Name, TotusIconDef>> = {
    phone: T.iconPhone,
    sparkle: T.iconMila,
};
const PARTNER: Partial<Record<Name, TotusIconDef>> = {
    plane: T.iconPOperators,
    hotel: T.iconPHotels,
    megaphone: T.iconPAdvertisers,
    card: T.iconPPayments,
};

export type HelpIconName = Name;
export type HelpIconPlace = 'section' | 'contact' | 'partner';

export function HelpIcon({
    name,
    size = 24,
    className,
    place = 'section',
}: {
    name: HelpIconName;
    size?: number;
    className?: string;
    place?: HelpIconPlace;
}) {
    const icon = (place === 'contact' ? CONTACT[name] : place === 'partner' ? PARTNER[name] : undefined) ?? SECTION[name];
    return <TotusIcon icon={icon} size={size} className={className} accent={place !== 'partner'} />;
}
