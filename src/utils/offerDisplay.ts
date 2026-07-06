import { getOfferConfirmabilityDisplayLabel } from '@/utils/roomFilters';

export type HotelRoomOffer = {
    id?: string;
    nights_count?: number;
    start_date?: string;
    price?: number;
    price_per_night?: number;
    operator_id?: number | string;
    operator_name?: string;
    confirmability_index?: number | string | null;
    extras?: {
        instant_confirm?: boolean;
        early_booking?: boolean;
        best_price?: boolean;
        cheap?: boolean;
        surcharge?: number;
        cancellation_policy?: {
            kind?: string;
            description?: string;
        } | null;
        included?: unknown;
    } | null;
    availability?: {
        flight?: string;
        hotel?: string;
        tooltip?: string;
    } | null;
    labels?: unknown;
    bonus_count?: number;
};

export type OfferDisplayInfo = {
    tags: string[];
};

export const OFFER_TAG_BEST_PRICE = 'Лучшая цена';

export function getOfferDisplayInfo(offer: HotelRoomOffer | null | undefined): OfferDisplayInfo {
    if (!offer) {
        return { tags: [] };
    }

    const tags: string[] = [];
    const extras = offer.extras ?? undefined;

    const confirmabilityLabel = getOfferConfirmabilityDisplayLabel(offer);
    if (confirmabilityLabel) {
        tags.push(confirmabilityLabel);
    }

    if (extras?.early_booking) {
        tags.push('Раннее бронирование');
    }

    if (extras?.best_price) {
        tags.push(OFFER_TAG_BEST_PRICE);
    }

    if (extras?.cheap) {
        tags.push('Выгодное предложение');
    }

    return { tags };
}
