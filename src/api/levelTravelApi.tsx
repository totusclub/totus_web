// import axios from 'axios';
//
// const BASE_URL = 'http://localhost:3001'; // փոխիր ըստ քո backend-ի host/port
//
// export async function startSearch(params) {
//     try {
//         const res = await axios.get(`${BASE_URL}/start-search`, { params });
//         return res.data; // ներառում է request_id
//     } catch (error) {
//         console.error('Error starting search:', error);
//         throw error;
//     }
// }
//
// export async function checkSearchStatus(requestId) {
//     try {
//         const res = await axios.get(`${BASE_URL}/search-status`, {
//             params: { request_id: requestId },
//         });
//         return res.data.status; // Object: {1: 'completed', 2: 'performing', ...}
//     } catch (error) {
//         console.error('Error checking search status:', error);
//         throw error;
//     }
// }
//
// export async function getGroupedHotels(requestId, operatorIds) {
//     try {
//         const res = await axios.get(`${BASE_URL}/grouped-hotels`, {
//             params: {
//                 request_id: requestId,
//                 operator_ids: operatorIds.join(','),
//             },
//         });
//         return res.data;
//     } catch (error) {
//         console.error('Error getting grouped hotels:', error);
//         throw error;
//     }
// }
//
// export async function runFullSearchFlow(searchParams, onProgress) {
//     const { request_id } = await startSearch(searchParams);
//
//     return new Promise((resolve, reject) => {
//         const interval = setInterval(async () => {
//             try {
//                 const statusMap = await checkSearchStatus(request_id);
//                 onProgress?.(statusMap); // callback ցուցադրելու համար
//
//                 const readyOperators = Object.entries(statusMap)
//                     .filter(([_, status]) => status === 'completed' || status === 'cached')
//                     .map(([id]) => id);
//
//                 if (readyOperators.length > 0) {
//                     clearInterval(interval);
//                     const hotels = await getGroupedHotels(request_id, readyOperators);
//                     resolve(hotels);
//                 }
//             } catch (err) {
//                 clearInterval(interval);
//                 reject(err);
//             }
//         }, 3000);
//     });
// }
//
//
// export async function getHotelOffers(data ) {
//     if (!data.request_id || !data.hotel_id) {
//         throw new Error('Missing request_id or hotel_id');
//     }
//
//     const params = {
//         request_id:data.request_id,
//         hotel_id:data.hotel_id,
//     };
//
//     // if (operator_ids) params.operator_ids = operator_ids;
//     if (data.compact !== undefined) params.compact = data.compact;
//
//     console.log('params',params)
//
//     const response = await axios.get(`${BASE_URL}/get-hotel-offers`, {
//         params,
//     });
//
//     return response.data;
// };
