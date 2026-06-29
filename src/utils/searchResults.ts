export function getHotelListItemKey(item: {
    hotel?: { id?: string | number };
    tour_id?: string | number;
    id?: string | number;
} | null | undefined): string | number | null {
    const key = item?.hotel?.id ?? item?.tour_id ?? item?.id;
    return key != null ? key : null;
}

export function normalizePageNumber(value: unknown): number {
    const page = Number(value);
    return Number.isFinite(page) && page > 0 ? page : 1;
}

export function mergeHotelPages(
    existing: Array<{ hotel?: { id?: string | number }; tour_id?: string | number; id?: string | number }>,
    incoming: Array<{ hotel?: { id?: string | number }; tour_id?: string | number; id?: string | number }>,
): typeof existing {
    if (!incoming.length) return existing;

    const existingKeys = new Set(
        existing.map(getHotelListItemKey).filter((key): key is string | number => key != null),
    );

    const uniqueIncoming = incoming.filter((item) => {
        const key = getHotelListItemKey(item);
        return key == null || !existingKeys.has(key);
    });

    return [...existing, ...(uniqueIncoming.length > 0 ? uniqueIncoming : incoming)];
}
