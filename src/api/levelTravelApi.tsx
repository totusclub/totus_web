import axios from 'axios';
import { API_BASE_URL } from '@/config/api';
import { parseUiPageNumber, toApiPageNumber } from '@/utils/searchResults';
import {
    getReadySearchOperators,
    shouldStopSearchPolling,
} from '@/utils/searchStatus';

const BASE_URL = API_BASE_URL;

function prepareStartSearchParams(raw: Record<string, unknown>): Record<string, string | number | boolean> {
    const out: Record<string, string | number | boolean> = {};
    if (!raw || typeof raw !== 'object') return out;

    for (const [key, value] of Object.entries(raw)) {
        if (value === undefined || value === null) continue;
        if (typeof value === 'string' && value.trim() === '') continue;
        if (Array.isArray(value)) {
            if (value.length === 0) continue;
            if (key === 'kids_ages' || key === 'hotel_ids') {
                out[key] = value.map((v) => String(v)).join(',');
            } else {
                out[key] = value.map((v) => String(v)).join(',');
            }
            continue;
        }
        if (typeof value === 'object') continue;
        if (key === 'page_number') {
            out[key] = toApiPageNumber(value);
            continue;
        }
        if (key === 'page_limit') {
            out[key] = Math.max(1, Number(value) || 20);
            continue;
        }
        out[key] = value as string | number | boolean;
    }
    return out;
}

export async function startSearch(params: Record<string, unknown>) {
    try {
        const flat = prepareStartSearchParams(params as Record<string, unknown>);
        const res = await axios.get(`${BASE_URL}/start-search`, { params: flat });
        return res.data;
    } catch (error) {
        console.error('Error starting search:', error);
        throw error;
    }
}

export interface SearchStatusResult {
    status: Record<string, string>;
    completeness: number;
}

export async function checkSearchStatus(
    requestId: string,
): Promise<SearchStatusResult | null> {
    if (!requestId) return null;

    try {
        const res = await axios.get(`${BASE_URL}/search-status`, {
            params: { request_id: requestId },
        });
        const status = res.data?.status;
        if (!status || typeof status !== 'object') return null;
        return {
            status: status as Record<string, string>,
            completeness: Number(res.data?.completeness) || 0,
        };
    } catch (error) {
        console.warn('[checkSearchStatus] Failed to check search status:', error);
        return null;
    }
}

export async function getHomeData(): Promise<any> {
    try {
        const response = await axios.get<any>(`${BASE_URL}/home/data`);
        return response.data;
    } catch (err) {
        return err;
    }
}

export async function getGroupedHotels(params: { request_id?: string; readyOperators?: string[] | string; [key: string]: unknown }) {
    try {
        if (!params?.request_id) {
            throw new Error('Missing request_id');
        }

        const sanitizedParams = Object.fromEntries(
            Object.entries(params || {}).filter(([key, value]) => {
                if (key === 'request_id' && !value) return false;
                if (value === null || value === undefined) return false;
                if (typeof value === 'string') return value.trim() !== '';
                if (Array.isArray(value)) return value.length > 0;
                return true;
            }).map(([key, value]) => {
                if (key === 'page_number') {
                    return [key, toApiPageNumber(value)];
                }
                if (key === 'page_limit') {
                    return [key, Math.max(1, Number(value) || 20)];
                }
                return [key, value];
            })
        );

        const uiPageNumber = parseUiPageNumber(params?.page_number);

        const res = await axios.get(`${BASE_URL}/grouped-hotels`, {
            params: sanitizedParams,
            paramsSerializer: {
                indexes: null,
            },
        });
        return { ...res.data, ...sanitizedParams, ui_page_number: uiPageNumber };
    } catch (error) {
        console.error('Error getting grouped hotels:', error);
        throw error;
    }
}

export async function runFullSearchFlow(searchParams: never, onProgress: (arg0: never) => void) {
    const { request_id } = await startSearch(searchParams);

    return new Promise((resolve, reject) => {
        const interval = setInterval(async () => {
            try {
                const searchStatus = await checkSearchStatus(request_id);
                if (!searchStatus) return;

                const { status: statusMap, completeness } = searchStatus;
                onProgress?.(statusMap);

                if (!shouldStopSearchPolling(statusMap, completeness)) return;

                clearInterval(interval);
                const readyOperators = getReadySearchOperators(statusMap);

                const groupedParams: Record<string, unknown> = { request_id };
                if (readyOperators.length > 0) {
                    groupedParams.readyOperators = readyOperators;
                }

                const hotels = await getGroupedHotels(groupedParams);
                resolve(hotels);
            } catch (err) {
                clearInterval(interval);
                reject(err);
            }
        }, 3000);
    });
}


export async function getHotelOffers(data: { request_id: never; hotel_id: never; compact: never; }) {
    if (!data.request_id || !data.hotel_id) {
        throw new Error('Missing request_id or hotel_id');
    }

    const params = {
        request_id: data.request_id,
        hotel_id: data.hotel_id,
    };

    // if (operator_ids) params.operator_ids = operator_ids;
    if (data.compact !== undefined) params.compact = data.compact;


    const response = await axios.get(`${BASE_URL}/get-hotel-offers`, {
        params,
    });

    return response.data;
};


export async function getHotelRooms(data: {
    request_id: string;
    hotel_id: string | number;
    meals?: string;
    free_cancel?: boolean | string;
    confirmability?: string;
    operators?: string;
}) {
    if (!data.request_id || !data?.hotel_id) {
        throw new Error('Missing request_id or hotel_id');
    }

    const params: Record<string, string | number | boolean> = {
        request_id: data.request_id,
        hotel_id: data.hotel_id,
    };

    if (data.meals) params.meals = data.meals;
    if (data.confirmability) params.confirmability = data.confirmability;
    if (data.operators) params.operators = data.operators;
    if (data.free_cancel !== undefined) params.free_cancel = data.free_cancel;

    const response = await axios.get(`${BASE_URL}/hotels-rooms`, {
        params,
    });

    return response.data;
};

export async function getHotelInfo(data: {
    hotel_id: number | string;
    search_type?: 'package' | 'hotel';
}) {
    if (!data.hotel_id) {
        throw new Error('Missing request_id or hotel_id');
    }

    const params = {
        hotel_ids: data.hotel_id,
        search_type: data.search_type === 'hotel' ? 'hotel' : 'package',
    };


    // console.log('params',params)

    const response = await axios.get(`${BASE_URL}/references/hotels`, {
        params,
    });

    return response.data.hotels[0];
};

export interface HotelReview {
    id: number;
    average_rating: number;
    name: string;
    author: number;
    avatar_url: string;
    title: string;
    content: string;
    answer?: string;
    created_at: string;
}

export interface HotelReviewsResponse {
    success: boolean;
    hotel: {
        id: number;
        rating: number;
        name: string;
    };
    reviews: HotelReview[];
}

export async function getHotelReviews(data: {
    hotel_id: number | string;
    page?: number;
    per_page?: number;
}): Promise<HotelReviewsResponse> {
    if (!data.hotel_id) {
        throw new Error('Missing hotel_id');
    }

    const response = await axios.get<HotelReviewsResponse>(
        `${BASE_URL}/references/hotel_reviews/${data.hotel_id}`,
        {
            params: {
                page: data.page ?? 1,
                per_page: data.per_page ?? 10,
            },
        },
    );

    return response.data;
}

export async function createPackage(data: { request_id: never; tour_id: never; }) {
    if (!data.request_id || !data.tour_id) {
        throw new Error('Missing request_id or hotel_id');
    }

    const params = {
        request_id: data.request_id,
        tour_id: data.tour_id,
    };
    const response = await axios.get(`${BASE_URL}/packages/package_details`, {
        params,
    });

    return response.data;
};
export async function PackagesActualize(
    id: never,
    options?: { search_type?: 'package' | 'hotel' }
) {
    if (!id) {
        throw new Error('Missing package_id');
    }

    const params = {
        package_id: id,
        search_type: options?.search_type === 'hotel' ? 'hotel' : 'package',
    };
    const response = await axios.get(`${BASE_URL}/packages/actualize`, {
        params,
    });

    return response.data;
};

function sanitizePackageFlightsParams(
    params: Record<string, unknown>,
): Record<string, unknown> {
    const cleaned: Record<string, unknown> = {};

    for (const [key, value] of Object.entries(params || {})) {
        if (value == null) continue;
        if (Array.isArray(value) && value.length === 0) continue;
        if (
            typeof value === 'object' &&
            !Array.isArray(value) &&
            Object.values(value as Record<string, unknown>).every(
                (v) => v == null || v === '',
            )
        ) {
            continue;
        }
        cleaned[key] = value;
    }

    return cleaned;
}

export async function Packagesflights(params: Record<string, unknown>) {
    const packageId = params?.package_id ?? params?.packageId;
    if (packageId == null || packageId === '') {
        throw new Error('Missing package_id');
    }

    const body = sanitizePackageFlightsParams({
        ...params,
        package_id: Number(packageId) || packageId,
    });

    const response = await axios.post(`${BASE_URL}/packages/flights`, body);
    return response.data;
}

export async function PackagesActualizeFlight(id: never, f_id: never) {
    if (!id) {
        throw new Error('Missing package_id');
    }

    const params = {
        package_id: id,
        flight_pair_id: f_id,
        search_type: 'package'
    };
    const response = await axios.get(`${BASE_URL}/packages/actualize`, {
        params,
    });

    return response.data;
};

export async function prebuildOrder(params: Record<string, unknown>) {
    if (!params?.package_id) {
        throw new Error('Missing package_id');
    }
    const response = await axios.post(`${BASE_URL}/orders/prebuild`, params);
    return response.data;
}

export async function prebookPackage(params: Record<string, unknown>) {
    if (!params?.package_id) {
        throw new Error('Missing package_id');
    }
    try {
        const response = await axios.post(`${BASE_URL}/packages/prebook`, params);
        return response.data;
    } catch (err: any) {
        return {
            success: false,
            error: err?.response?.data?.error ?? err?.response?.data ?? err?.message,
            errors: err?.response?.data?.errors ?? [],
            skippable: Boolean(err?.response?.data?.skippable),
            status: err?.response?.status,
            isAxiosError: true,
        };
    }
}

export async function validateTourist(params: never) {
    try {
        if (!params) {
            throw new Error('Missing package_id');
        }
        const response = await axios.post(`${BASE_URL}/validate-tourists`, params);
        return response.data;
    } catch (err) {
        return err
    }
};
export async function createOrder(params: never) {
    try {
        if (!params) {
            throw new Error('Missing package_id');
        }
        const response = await axios.post(`${BASE_URL}/create-package`, params);
        return response.data;
    } catch (err) {
        return err
    }
};

export async function createPay(params: {
    orderId: string;
    orderName: string;
    expire: Date | string;
    amount: { value: any; code: string };
    returnUrl: string;
    paymentPurpose?: string;
}) {
    try {
        if (!params?.orderId || params?.amount?.value == null) {
            throw new Error('Missing payment params');
        }
        const response = await axios.post(`${BASE_URL}/vtb/create-order`, {
            ...params,
            expire:
                params.expire instanceof Date
                    ? params.expire.toISOString()
                    : params.expire,
        });
        return response.data;
    } catch (err: any) {
        return {
            status: 'error',
            error:
                err?.response?.data?.error ||
                err?.response?.data?.details ||
                err?.response?.data?.message ||
                err?.message ||
                'Failed to create payment',
            details: err?.response?.data?.details,
            isAxiosError: true,
        };
    }
}
export async function checkPay(params: {
    orderId?: string | number | string[];
    qrcId?: string | null;
}) {
    try {
        if (!params?.orderId && !params?.qrcId) {
            throw new Error('Missing orderId or qrcId');
        }
        const orderId = Array.isArray(params.orderId)
            ? params.orderId[0]
            : params.orderId;
        const payload = {
            ...(orderId != null ? { orderId: String(orderId) } : {}),
            ...(params.qrcId ? { qrcId: String(params.qrcId) } : {}),
        };
        const response = await axios.post(`${BASE_URL}/check_pay`, payload);
        return response.data;
    } catch (err: any) {
        return err?.response?.data || { status: 'error', message: err?.message };
    }
}

export async function getOrder(id: never) {
    if (!id) {
        throw new Error('Missing package_id');
    }

    const params = {
        order_id: id,
    };
    const response = await axios.get(`${BASE_URL}/orders`, {
        params,
    });

    return response.data;
};

export async function getOrderDocuments(orderId: string | number) {
    if (!orderId) {
        throw new Error('Missing order_id');
    }

    const response = await axios.get(`${BASE_URL}/orders/documents`, {
        params: { order_id: orderId },
    });

    return response.data;
}

export async function getOrdersUsers(id: never) {
    if (!id) {
        throw new Error('Missing package_id');
    }

    const params = {
        user_id: id,
    };
    const response = await axios.get(`${BASE_URL}/user/orders`, {
        params,
    });

    return response.data;
};
