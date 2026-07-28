export function getHotelListItemKey(item: {
    hotel?: { id?: string | number };
    tour_id?: string | number;
    id?: string | number;
} | null | undefined): string | number | null {
    const key = item?.hotel?.id ?? item?.tour_id ?? item?.id;
    return key != null ? key : null;
}

/** User-facing / URL page number (1-based). Invalid and 0 map to page 1. */
export function parseUiPageNumber(value: unknown): number {
    const page = Number(value);
    return Number.isFinite(page) && page > 0 ? page : 1;
}

/** @deprecated Use parseUiPageNumber */
export const normalizePageNumber = parseUiPageNumber;

/** API page number (0-based). UI page 1 → API page 0. */
export function toApiPageNumber(value: unknown): number {
    return Math.max(0, parseUiPageNumber(value) - 1);
}

/** Normalize operator ids to a single CSV string (avoids readyOperators=6&readyOperators=7). */
export function toOperatorIdsCsv(value: unknown): string {
    if (value == null) return '';
    if (Array.isArray(value)) {
        return value
            .map((v) => String(v).trim())
            .filter(Boolean)
            .join(',');
    }
    const raw = String(value).trim();
    if (!raw) return '';
    // Already CSV or single id
    return raw
        .split(',')
        .map((v) => v.trim())
        .filter(Boolean)
        .join(',');
}

export function getNextPageNumber(shownCount: number, pageLimit: number): number {
    const limit = Number.isFinite(pageLimit) && pageLimit > 0 ? pageLimit : 50;
    const shown = Number.isFinite(shownCount) && shownCount > 0 ? shownCount : 0;
    // Pages already loaded (partial first page still counts as 1 page).
    const pagesLoaded = shown <= 0 ? 0 : Math.ceil(shown / limit);
    return pagesLoaded + 1;
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

export function hasMoreHotelResults({
    shownCount,
    totalCount,
    lastPageSize,
    pageLimit = 50,
}: {
    shownCount: number;
    totalCount: number;
    lastPageSize: number;
    pageLimit?: number;
}): boolean {
    if (shownCount <= 0) return false;

    if (totalCount > 0) {
        if (shownCount >= totalCount) return false;
        return shownCount < totalCount;
    }

    if (lastPageSize <= 0) return false;

    return lastPageSize >= pageLimit;
}
