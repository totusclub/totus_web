// Адреса документов под формами сайта. Тексты согласий — src/components/UI/consentCheckbox.
// Файл без импортов: проверка scripts/check-consents.mjs загружает его напрямую в Node.

export const LEGAL_LINKS = {
    terms: '/terms',
    privacy: '/privacy-policy',
    consent: '/consent',
    adsConsent: '/ads-consent',
    cookies: '/cookie-settings',
    tourOffer: '/tour-offer',
    hotelBooking: '/hotel-booking',
    cancellation: '/cancellation',
    touristMemo: '/tourist-memo',
    payment: '/payment',
    legal: '/legal',
} as const;

/** Галочки, которые уходят на сервер (totus_API, журнал согласий consent_log). Версии документов знает сервер. */
export type ConsentKey = 'pd' | 'ads' | 'tour_offer' | 'hotel_terms';
export type Consents = Partial<Record<ConsentKey, boolean>>;

/** Все обязательные отмечены? */
export function hasRequiredConsents(consents: Consents, required: ConsentKey[]): boolean {
    return required.every((key) => consents[key] === true);
}
