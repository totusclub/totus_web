import axios from 'axios';
import { startSearch } from '@/api/levelTravelApi';
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

    return newQuery;
}

export async function createHotelSearchRequest(
    query: Record<string, string | string[] | undefined>,
    hotelId: string,
): Promise<string | null> {
    const searchParams = buildInitialSearchParams(query, hotelId);
    const response = await startSearch(searchParams);
    return response?.request_id ? String(response.request_id) : null;
}
