import axios from 'axios';
import { startSearch, getHotelInfo } from '@/api/levelTravelApi';
import { buildInitialSearchParams } from '@/utils/hotelDetailsUtils';

export function isStaleSearchRequestError(error: unknown): boolean {
    if (!axios.isAxiosError(error)) return false;
    const status = error.response?.status;
    return status === 400 || status === 404 || status === 410 || status === 500 || status === 502 || status === 503;
}

export function buildHotelSearchQueryUpdate(
    query: Record<string, string | string[] | undefined>,
    hotelId: string,
    requestId: string,
): Record<string, string | string[] | undefined> {
    const searchParams = buildInitialSearchParams(query, hotelId);

    const newQuery: Record<string, string | string[] | undefined> = {
        ...query,
        request_id: requestId,
    };

    if (searchParams.start_date) {
        newQuery.start_date = String(searchParams.start_date);
        newQuery.start_date_from = String(searchParams.start_date_from ?? searchParams.start_date);
    }
    if (searchParams.end_date_till) {
        newQuery.end_date_till = String(searchParams.end_date_till);
    }
    if (searchParams.nights) {
        newQuery.nights = String(searchParams.nights);
    }
    if (searchParams.from_city) {
        newQuery.from_city = String(searchParams.from_city);
    }
    if (searchParams.from_country) {
        newQuery.from_country = String(searchParams.from_country);
    }
    if (searchParams.adults) {
        newQuery.adults = String(searchParams.adults);
    }
    if (searchParams.search_type) {
        newQuery.search_type = String(searchParams.search_type);
    }
    if (searchParams.flex_dates != null) {
        newQuery.flex_dates = String(searchParams.flex_dates);
    }

    // Keep list→details handoff params across hotel-scoped request_id replace.
    const preserveKeys = [
        'filter_meals',
        'meal_id',
        'meal_type',
        'list_price',
        'filter_operators',
        'operator_id',
        'operator_name',
        'room_type',
        'room_id',
        'offer_id',
    ] as const;
    preserveKeys.forEach((key) => {
        const value = query[key];
        if (value != null && value !== '') {
            newQuery[key] = value;
        }
    });

    return newQuery;
}

export async function createHotelSearchRequest(
    query: Record<string, string | string[] | undefined>,
    hotelId: string,
): Promise<string | null> {
    const searchParams = buildInitialSearchParams(query, hotelId);

    // LevelTravel enqueue requires a destination. Deep links (home cards,
    // favorites) may not carry to_country — resolve it from the hotel itself.
    if (!searchParams.to_country) {
        try {
            const hotelInfo = await getHotelInfo({ hotel_id: hotelId });
            const iso2 = hotelInfo?.country?.iso2;
            if (iso2) {
                searchParams.to_country = String(iso2);
            }
            const cityName = hotelInfo?.city?.name_en || hotelInfo?.city?.name_ru;
            if (!searchParams.to_city && cityName) {
                searchParams.to_city = String(cityName);
            }
        } catch (err) {
            console.warn('[createHotelSearchRequest] Failed to resolve hotel country:', err);
        }
        if (!searchParams.to_country) {
            searchParams.to_country = 'RU';
        }
    }

    const response = await startSearch(searchParams);
    const requestId = response?.request_id ? String(response.request_id) : null;
    if (requestId && typeof window !== 'undefined') {
        sessionStorage.setItem(`hotel_scoped_rid_${hotelId}`, requestId);
    }
    return requestId;
}

export function isHotelScopedRequestId(
    hotelId: string | undefined,
    requestId: string | null | undefined,
): boolean {
    if (!hotelId || !requestId || typeof window === 'undefined') return false;
    return sessionStorage.getItem(`hotel_scoped_rid_${hotelId}`) === String(requestId);
}
