/**
 * Room Type v3 (totus_API custom rooms): наши предложения («Arlekino») приходят
 * внутри `offers[meal]` исходного номера Level.Travel и помечены
 * `offer.lt_extras.totus.custom === true`. Группировка — только по этой метке:
 * ни по id (`t…` — только для booking-развода на backend), ни по оператору, ни по названию.
 */

export type RoomOfferLike = {
    id?: string | number;
    price?: number | string | null;
    analytics_price?: number | string | null;
    lt_extras?: { totus?: { custom?: boolean } | null } | null;
    [key: string]: unknown;
};

export type OfferSource = 'arlekino' | 'levelTravel';

export const OFFER_GROUP_LABELS: Record<OfferSource, string> = {
    arlekino: 'Arlekino',
    levelTravel: 'Level.Travel',
};

/** Порядок групп в списке предложений номера: сначала наши, затем Level.Travel. */
export const OFFER_GROUP_ORDER: OfferSource[] = ['arlekino', 'levelTravel'];

/** Наши операторы в offers: `operator_id = 990000 + roomTypeId` (totus_API custom rooms). */
export const ARLEKINO_OPERATOR_ID_BASE = 990000;

/** Оператор «Arlekino» (id ≥ 990000) — Level.Travel такого оператора не знает, в API-фильтры не передаём. */
export function isArlekinoOperatorId(id: unknown): boolean {
    const value = Number(id);
    return Number.isFinite(value) && value >= ARLEKINO_OPERATOR_ID_BASE;
}

export function isArlekinoOffer(offer: unknown): boolean {
    const record = offer as RoomOfferLike | null | undefined;
    return Boolean(record?.lt_extras?.totus?.custom);
}

export function getOfferSource(offer: unknown): OfferSource {
    return isArlekinoOffer(offer) ? 'arlekino' : 'levelTravel';
}

export function getOfferPrice(offer: unknown): number | null {
    const record = offer as RoomOfferLike | null | undefined;
    const value = Number(record?.analytics_price ?? record?.price);
    return Number.isFinite(value) ? value : null;
}

function comparePriceAsc(a: unknown, b: unknown): number {
    const priceA = getOfferPrice(a) ?? Number.POSITIVE_INFINITY;
    const priceB = getOfferPrice(b) ?? Number.POSITIVE_INFINITY;
    return priceA - priceB;
}

/** Копия списка, отсортированная по цене (analytics_price ?? price) по возрастанию, стабильно. */
export function sortOffersByPrice<T>(offers: readonly T[] | null | undefined): T[] {
    return [...(offers ?? [])].sort(comparePriceAsc);
}

/**
 * Делит предложения на две группы по метке `lt_extras.totus.custom`;
 * внутри каждой группы — сортировка по цене. Ничего не дедуплицируется.
 */
export function splitOffersBySource<T>(
    offers: readonly T[] | null | undefined,
): { arlekino: T[]; levelTravel: T[] } {
    const arlekino: T[] = [];
    const levelTravel: T[] = [];
    (offers ?? []).forEach((offer) => {
        if (isArlekinoOffer(offer)) arlekino.push(offer);
        else levelTravel.push(offer);
    });
    return {
        arlekino: sortOffersByPrice(arlekino),
        levelTravel: sortOffersByPrice(levelTravel),
    };
}

/** Минимальная цена по всем предложениям (наши + Level.Travel); null — если цен нет. */
export function minOfferPrice(offers: readonly unknown[] | null | undefined): number | null {
    let min: number | null = null;
    (offers ?? []).forEach((offer) => {
        const price = getOfferPrice(offer);
        if (price == null) return;
        if (min == null || price < min) min = price;
    });
    return min;
}

/** Все предложения номера (по всем типам питания) одним списком. */
export function flattenRoomOffers<T = unknown>(
    room: { offers?: Record<string, T[] | null | undefined> | null } | null | undefined,
): T[] {
    return Object.values(room?.offers ?? {}).flatMap((list) => (Array.isArray(list) ? list : []));
}

/** Есть ли у номера хотя бы одно наше предложение. */
export function roomHasArlekinoOffers(
    room: { offers?: Record<string, unknown[] | null | undefined> | null } | null | undefined,
): boolean {
    return flattenRoomOffers(room).some(isArlekinoOffer);
}
