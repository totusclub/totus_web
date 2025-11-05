// // store/slices/searchSlice.ts
// import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
// import { checkSearchStatus, getGroupedHotels, startSearch } from "@/api/levelTravelApi";
//
// interface SearchState {
//     hotels: any;
//     allHotels: any[];   // ✅ new
//     progress: Record<string, string>;
//     loading: boolean;
//     error: string | null;
//     requestId: string | null | undefined;
//     operators: [string] | [];
//     headerName: string;
//     startSearchValid: boolean;
//     loadMore: boolean;
// }
//
// const initialState: SearchState = {
//     hotels: null,
//     allHotels: [],   // ✅ new
//     progress: {},
//     loading: false,
//     error: null,
//     headerName: '',
//     startSearchValid: true,
//     loadMore: false,
// };
//
// // ✅ Thunks stay the same (no change)
// export const runFullSearchFlow = createAsyncThunk(
//     'search/runFullSearchFlow',
//     async (
//         {
//             searchParams,
//             filterParams,
//         }: { searchParams: any | null; filterParams?: any | null },
//         { rejectWithValue, dispatch }
//     ) => {
//         try {
//             const { request_id } = await startSearch(searchParams);
//
//             return await new Promise(async (resolve, reject) => {
//                 const interval = setInterval(async () => {
//                     try {
//                         const statusMap = await checkSearchStatus(request_id);
//                         dispatch(updateProgress(statusMap));
//
//                         const readyOperators = Object.entries(statusMap)
//                             .filter(([_, status]) => status === 'completed' || status === 'cached')
//                             .map(([id]) => id);
//
//                         if (readyOperators.length > 0) {
//                             clearInterval(interval);
//                             let filters = { request_id, readyOperators };
//                             if (filterParams && typeof filterParams === 'object') {
//                                 filters = { ...filters, ...filterParams };
//                             }
//
//                             const hotels = await getGroupedHotels({ ...filters });
//                             resolve({ ...hotels, ...filters });
//                         }
//                     } catch (err) {
//                         clearInterval(interval);
//                         reject(err);
//                     }
//                 }, 3000);
//             });
//         } catch (err: any) {
//             return rejectWithValue(err.message || 'Failed to complete search');
//         }
//     }
// );
//
// export const searchFilters = createAsyncThunk(
//     'search/filters',
//     async (params: any, { rejectWithValue }) => {
//         try {
//             return await getGroupedHotels(params);
//         } catch (err: any) {
//             return rejectWithValue(err.message || 'Failed to fetch grouped hotels');
//         }
//     }
// );
//
// // ✅ Slice
// const searchSlice = createSlice({
//     name: 'search',
//     initialState,
//     reducers: {
//         updateProgress(state, action) {
//             state.progress = action.payload;
//         },
//         clearSearch(state) {
//             state.hotels = null;
//             state.allHotels = [];   // ✅ reset too
//             state.progress = {};
//             state.loading = false;
//             state.error = null;
//         },
//         setHeaderName(state, action) {
//             state.headerName = action.payload;
//         },
//         setStartSearch(state, action) {
//             state.startSearchValid = action.payload;
//         },
//         setLoadMore(state, action) {
//             state.loadMore = action.payload;
//         },
//
//         // ✅ new reducers for hotels accumulation
//         setAllHotels(state, action: PayloadAction<any[]>) {
//             state.allHotels = action.payload;
//         },
//         appendHotels(state, action: PayloadAction<any[]>) {
//             state.allHotels = [...state.allHotels, ...action.payload];
//         },
//     },
//     extraReducers: (builder) => {
//         builder
//             .addCase(runFullSearchFlow.pending, (state) => {
//                 state.loading = true;
//                 state.error = null;
//                 state.progress = {};
//             })
//             .addCase(runFullSearchFlow.fulfilled, (state, action) => {
//                 state.hotels = action.payload;
//                 state.loading = false;
//                 // ✅ optional: reset allHotels when new search starts
//                 state.allHotels = action.payload.hotels || [];
//             })
//             .addCase(runFullSearchFlow.rejected, (state, action) => {
//                 state.loading = false;
//                 state.error = action.payload as string;
//             })
//             .addCase(searchFilters.pending, (state) => {
//                 state.loading = true;
//                 state.error = null;
//                 state.progress = {};
//             })
//             .addCase(searchFilters.fulfilled, (state, action) => {
//                 state.hotels = action.payload;
//                 state.loading = false;
//                 // ✅ update hotels list for filters
//                 state.allHotels = action.payload.hotels || [];
//             })
//             .addCase(searchFilters.rejected, (state, action) => {
//                 state.loading = false;
//                 state.error = action.payload as string;
//             });
//     },
// });
//
// export const {
//     updateProgress,
//     clearSearch,
//     setHeaderName,
//     setStartSearch,
//     setLoadMore,
//     setAllHotels,
//     appendHotels,
// } = searchSlice.actions;
//
// export default searchSlice.reducer;




// // store/slices/searchSlice.ts
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import {checkSearchStatus, getGroupedHotels, startSearch} from "@/api/levelTravelApi";

interface SearchState {
    hotels: any;
    progress: Record<string, string>;
    loading: boolean;
    error: string | null;
    requestId: string | null | undefined;
    operators: [string] | [];
    headerName: string;
    startSearchValid:boolean
    loadMore: boolean;
    allMyHotels: [];
}

const initialState: SearchState = {
    hotels: null,
    progress: {},
    loading: false,
    error: null,
    headerName:'',
    startSearchValid:true,
    loadMore:false,
    allMyHotels:[]
};

// Thunk
export const runFullSearchFlow = createAsyncThunk(
    'search/runFullSearchFlow',
    async (
        {
            searchParams,
            filterParams,
        }: { searchParams: any | null; filterParams?: any | null },
        { rejectWithValue, dispatch }
    ) => {
        try {
            const { request_id } = await startSearch(searchParams);

            return await new Promise(async (resolve, reject) => {
                const interval = setInterval(async () => {
                    try {
                        const statusMap = await checkSearchStatus(request_id);
                        dispatch(updateProgress(statusMap));

                        const readyOperators = Object.entries(statusMap)
                            .filter(([_, status]) => status === 'completed' || status === 'cached')
                            .map(([id]) => id);

                        if (readyOperators.length > 0) {
                            clearInterval(interval);
                            let filters = { request_id, readyOperators };
                            if (filterParams && typeof filterParams === 'object') {
                                filters = { ...filters, ...filterParams };
                            }

                            const hotels = await getGroupedHotels({...filters});
                            resolve({...hotels,...filters});
                        }
                    } catch (err) {
                        clearInterval(interval);
                        reject(err);
                    }
                }, 3000);
            });
        } catch (err: any) {
            return rejectWithValue(err.message || 'Failed to complete search');
        }
    }
);


export const searchFilters = createAsyncThunk(
    'search/filters',
    async (params: any, { rejectWithValue }) => {
        try {
            return await getGroupedHotels(params);
        } catch (err: any) {
            return rejectWithValue(err.message || 'Failed to fetch grouped hotels');
        }
    }
);

// Slice
const searchSlice = createSlice({
    name: 'search',
    initialState,
    reducers: {
        updateProgress(state, action) {
            state.progress = action.payload;
        },

        // hotels: null,
        // progress: {},
        // loading: false,
        // error: null,
        // headerName:'',
        // startSearchValid:true,
        // loadMore:false,
        // allMyHotels:[]
        clearSearch(state) {
            state.hotels = null;
            state.progress = {};
            state.loading = false;
            state.error = null;
            state.headerName = '';
            state.startSearchValid = true;
            state.loadMore = false;
            state.allMyHotels = [];
            // state.requestId = '';
        },
        setHeaderName(state, action) {
            state.headerName = action.payload;
        },
        setStartSearch(state, action) {
            state.startSearchValid = action.payload;
        },
        setLoadMore(state, action) {
            state.loadMore = action.payload;
        },
        appendAllHotels(state, action) {
            state.allMyHotels = [...state.allMyHotels, action.payload.hotels];
        },
        setAllMyHotels(state, action) {
            // Handle both { hotels: [] } and [] formats
            if (Array.isArray(action.payload)) {
                state.allMyHotels = action.payload;
            } else {
                state.allMyHotels = action.payload?.hotels || [];
            }
        }

    },
    extraReducers: (builder) => {
        builder
            .addCase(runFullSearchFlow.pending, (state) => {
                state.loading = true;
                state.error = null;
                // state.hotels = null;
                state.progress = {};
            })
            .addCase(runFullSearchFlow.fulfilled, (state, action) => {
                state.hotels = action.payload;
                state.loading = false;
                state.allMyHotels = action.payload.hotels;
            })
            .addCase(runFullSearchFlow.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload as string;
            })
            .addCase(searchFilters.pending, (state) => {
                state.loading = true;
                state.error = null;
                // state.hotels = null;
                state.progress = {};
            })
            .addCase(searchFilters.fulfilled, (state, action) => {
                state.hotels = action.payload;
                state.loading = false;
                // If page_number is 1, replace hotels. Otherwise append for pagination
                const pageNumber = action.payload.page_number || 1;
                const hotels = action.payload.hotels || [];
                
                if (pageNumber === 1) {
                    // Replace the entire list for new searches/filters/sorts
                    state.allMyHotels = hotels;
                } else {
                    // Append for pagination
                    state.allMyHotels = [...(state.allMyHotels || []), ...hotels];
                }
            })
            .addCase(searchFilters.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload as string;
            })
    },
});

export const { updateProgress, clearSearch,setHeaderName,setStartSearch,setLoadMore,setAllMyHotels } = searchSlice.actions;

export default searchSlice.reducer;
