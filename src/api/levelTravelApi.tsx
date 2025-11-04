import axios from 'axios';

// const BASE_URL = 'http://192.168.1.105:3001';
const BASE_URL = 'https://api.totus.club';

export async function startSearch(params) {
    try {
        console.log('params22222',params)
        const res = await axios.get(`${BASE_URL}/start-search`,{params});
        return res.data;
    } catch (error) {
        console.error('Error starting search:', error);
        throw error;
    }
}

export async function checkSearchStatus(requestId) {
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

export async function getGroupedHotels(params) {
    try {
        const res = await axios.get(`${BASE_URL}/grouped-hotels`, {
            params: params,
        });
        return {...res.data,...params};
    } catch (error) {
        console.error('Error getting grouped hotels:', error);
        throw error;
    }
}

export async function runFullSearchFlow(searchParams, onProgress) {
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


export async function getHotelOffers(data ) {
    if (!data.request_id || !data.hotel_id) {
        throw new Error('Missing request_id or hotel_id');
    }

    const params = {
        request_id:data.request_id,
        hotel_id:data.hotel_id,
    };

    // if (operator_ids) params.operator_ids = operator_ids;
    if (data.compact !== undefined) params.compact = data.compact;

    console.log('params',params)

    const response = await axios.get(`${BASE_URL}/get-hotel-offers`, {
        params,
    });

    return response.data;
};


export async function getHotelRooms(data ) {
    if (!data.request_id && !data?.hotel_id) {
        throw new Error('Missing request_id or hotel_id');
    }

    const params = {
        request_id:data.request_id,
        hotel_id:data.hotel_id,
    };


    console.log('params',params)

    const response = await axios.get(`${BASE_URL}/hotels-rooms`, {
        params,
    });

    return response.data;
};

export async function getHotelInfo(data:any ) {
    console.log('data.....',data)
    if (!data.hotel_id) {
        throw new Error('Missing request_id or hotel_id');
    }

    const params = {
        hotel_ids:data.hotel_id,
        search_type:'package'
    };


    // console.log('params',params)

    const response = await axios.get(`${BASE_URL}/references/hotels`, {
        params,
    });

    return response.data.hotels[0];
};

export async function createPackage(data:any ) {
    if (!data.request_id || !data.tour_id) {
        throw new Error('Missing request_id or hotel_id');
    }

    const params = {
        request_id:data.request_id,
        tour_id:data.tour_id,
    };
    const response = await axios.get(`${BASE_URL}/packages/package_details`, {
        params,
    });

    return response.data;
};
export async function PackagesActualize(id:any ) {
    if (!id) {
        throw new Error('Missing package_id');
    }

    const params = {
        package_id:id,
        search_type:'package'
    };
    const response = await axios.get(`${BASE_URL}/packages/actualize`, {
        params,
    });

    return response.data;
};
export async function Packagesflights(params: any) {
    if (!params) {
        throw new Error('Missing package_id');
    }

    // const data = {
    //     package_id: id,
    // };
    console.log('Packagesflights',params)

    const response = await axios.post(`${BASE_URL}/packages/flights`, params);

    return response.data;
}

export async function PackagesActualizeFlight(id:any,f_id:any ) {
    if (!id) {
        throw new Error('Missing package_id');
    }

    const params = {
        package_id:id,
        flight_pair_id:f_id,
        search_type:'package'
    };
    const response = await axios.get(`${BASE_URL}/packages/actualize`, {
        params,
    });

    return response.data;
};

export async function validateTourist(params:any) {
    try {
        if (!params) {
            throw new Error('Missing package_id');
        }
        const response = await axios.post(`${BASE_URL}/validate-tourists`, params);
        return response.data;
    }catch(err) {
        return err
    }
};
export async function createOrder(params:any) {
    try {
        if (!params) {
            throw new Error('Missing package_id');
        }
        const response = await axios.post(`${BASE_URL}/create-package`, params);
        return response.data;
    }catch(err) {
        return err
    }
};

export async function createPay(params:any) {
    try {
        if (!params) {
            throw new Error('Missing package_id');
        }
        const response = await axios.post(`${BASE_URL}/vtb/create-order`, params);
        return response.data;
    }catch(err) {
        return err
    }
};
export async function checkPay(params:any) {
    try {
        if (!params) {
            throw new Error('Missing package_id');
        }
        const response = await axios.post(`${BASE_URL}/check_pay`, params);
        return response.data;
    }catch(err) {
        return err
    }
};

export async function getOrder(id:any) {
    if (!id) {
        throw new Error('Missing package_id');
    }

    const params = {
        order_id:id,
    };
    const response = await axios.get(`${BASE_URL}/orders`, {
        params,
    });

    return response.data;
};
export async function getOrdersUsers(id:any) {
    if (!id) {
        throw new Error('Missing package_id');
    }

    const params = {
        user_id:id,
    };
    const response = await axios.get(`${BASE_URL}/user/orders`, {
        params,
    });

    return response.data;
};
