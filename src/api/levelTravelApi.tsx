import axios from 'axios';

const BASE_URL = 'http://192.168.123.37:3001';
// const BASE_URL = 'https://api.totus.club';

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

export async function checkSearchStatus(requestId: string) {
    try {
        const res = await axios.get(`${BASE_URL}/search-status`, {
            params: { request_id: requestId },
        });
        return res.data.status; // Object: {1: 'completed', 2: 'performing', ...}
    } catch (error) {
        console.error('Error checking search status:', error);
        throw error;
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

export async function getGroupedHotels(params: { request_id: never; readyOperators: never; }) {
    try {
        const sanitizedParams = Object.fromEntries(
            Object.entries(params || {}).filter(([_, value]) => {
                if (value === null || value === undefined) return false;
                if (typeof value === 'string') return value.trim() !== '';
                if (Array.isArray(value)) return value.length > 0;
                // Keep valid falsy values like 0 and false.
                return true;
            })
        );

        const res = await axios.get(`${BASE_URL}/grouped-hotels`, {
            params: sanitizedParams,
        });
        return { ...res.data, ...sanitizedParams };
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
                const statusMap = await checkSearchStatus(request_id);
                onProgress?.(statusMap);

                const readyOperators = Object.entries(statusMap)
                    .filter(([_, status]) => status === 'completed' || status === 'cached')
                    .map(([id]) => id);

                if (readyOperators.length > 0) {
                    clearInterval(interval);
                    const hotels = await getGroupedHotels(request_id, readyOperators);
                    resolve(hotels);
                }
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


export async function getHotelRooms(data: { request_id: never; hotel_id: never; }) {
    if (!data.request_id && !data?.hotel_id) {
        throw new Error('Missing request_id or hotel_id');
    }

    const params = {
        request_id: data.request_id,
        hotel_id: data.hotel_id,
    };


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

export async function Packagesflights(params: never) {
    if (!params) {
        throw new Error('Missing package_id');
    }
    const response = await axios.post(`${BASE_URL}/packages/flights`, params);
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
    expire: Date;
    amount: { value: any; code: string };
    returnUrl: string
}) {
    try {
        if (!params) {
            throw new Error('Missing package_id');
        }
        const response = await axios.post(`${BASE_URL}/vtb/create-order`, params);
        return response.data;
    } catch (err) {
        return err
    }
};
export async function checkPay(params: never) {
    try {
        if (!params) {
            throw new Error('Missing package_id');
        }
        const response = await axios.post(`${BASE_URL}/check_pay`, params);
        return response.data;
    } catch (err) {
        return err
    }
};

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
