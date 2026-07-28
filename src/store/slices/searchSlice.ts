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
import { mergeHotelPages, parseUiPageNumber } from '@/utils/searchResults';
import {
    getReadySearchOperators,
    shouldStopSearchPolling,
} from '@/utils/searchStatus';
import { sanitizeListingFilterParams } from '@/utils/searchListState';

let activeSearchPoll: ReturnType<typeof setTimeout> | null = null;
let activeSearchPollAttempts = 0;
let activeSearchPollReject: ((reason: Error) => void) | null = null;
const MAX_SEARCH_POLL_ATTEMPTS = 40;
const SEARCH_POLL_DELAY_MS = 3000;
export const SEARCH_POLL_CANCELLED = 'SEARCH_POLL_CANCELLED';

function clearActiveSearchPoll() {
    if (activeSearchPoll) {
        clearTimeout(activeSearchPoll);
        activeSearchPoll = null;
    }
    activeSearchPollAttempts = 0;
    activeSearchPollReject = null;
}

export function stopActiveSearchPoll() {
    if (activeSearchPoll) {
        clearTimeout(activeSearchPoll);
        activeSearchPoll = null;
    }
    activeSearchPollAttempts = 0;

    if (activeSearchPollReject) {
        const reject = activeSearchPollReject;
        activeSearchPollReject = null;
        reject(new Error(SEARCH_POLL_CANCELLED));
    }
}

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
        clearActiveSearchPoll();

        try {
            const { request_id } = await startSearch(searchParams);

            if (!request_id) {
                return rejectWithValue('Missing request_id from search');
            }

            return await new Promise(async (resolve, reject) => {
                activeSearchPollAttempts = 0;
                activeSearchPollReject = reject;
                let pollingStopped = false;

                const scheduleNextPoll = () => {
                    if (pollingStopped) return;
                    activeSearchPoll = setTimeout(() => {
                        activeSearchPoll = null;
                        void pollOnce();
                    }, SEARCH_POLL_DELAY_MS);
                };

                const pollOnce = async () => {
                    if (pollingStopped) return;

                    activeSearchPollAttempts += 1;
                    if (activeSearchPollAttempts > MAX_SEARCH_POLL_ATTEMPTS) {
                        pollingStopped = true;
                        clearActiveSearchPoll();
                        reject(new Error('Search timed out'));
                        return;
                    }

                    try {
                        const searchStatus = await checkSearchStatus(request_id);

                        if (!searchStatus) {
                            scheduleNextPoll();
                            return;
                        }

                        const { status: statusMap, completeness } = searchStatus;

                        dispatch(updateProgress(statusMap));

                        if (!shouldStopSearchPolling(statusMap, completeness)) {
                            scheduleNextPoll();
                            return;
                        }

                        pollingStopped = true;
                        clearActiveSearchPoll();

                        const readyOperators = getReadySearchOperators(statusMap);

                        let filters: Record<string, unknown> = { request_id };
                        if (readyOperators.length > 0) {
                            filters.readyOperators = readyOperators;
                        }
                        if (filterParams && typeof filterParams === 'object') {
                            filters = { ...filters, ...filterParams };
                        }

                        const hotels = await getGroupedHotels({
                            ...filters,
                            page_number: parseUiPageNumber(filters.page_number),
                            page_limit: Math.max(1, Number(filters.page_limit) || 50),
                        });
                        resolve({
                            ...hotels,
                            request_id,
                            readyOperators,
                            ...filterParams,
                        });
                    } catch (err) {
                        pollingStopped = true;
                        clearActiveSearchPoll();
                        reject(err);
                    }
                };

                void pollOnce();
            });
        } catch (err: any) {
            clearActiveSearchPoll();
            return rejectWithValue(err.message || 'Failed to complete search');
        }
    }
);


export const searchFilters = createAsyncThunk(
    'search/filters',
    async (params: any, { rejectWithValue }) => {
        clearActiveSearchPoll();

        if (!params?.request_id) {
            return rejectWithValue('Missing request_id');
        }

        try {
            const hotels = await getGroupedHotels({
                ...params,
                page_number: parseUiPageNumber(params?.page_number),
                page_limit: Math.max(1, Number(params?.page_limit) || 50),
            });

            // Persist applied filter params on the hotels object (API response does not echo them).
            // Without this, hotel cards fall back to default package meals (AI).
            // Sanitize so amenity=false / empty strings are not re-applied over the cleaned response.
            const {
                request_id,
                readyOperators,
                page_number,
                page_limit,
                hotels: _hotelsIgnored,
                filters: _filtersIgnored,
                ...appliedFilters
            } = params || {};

            return {
                ...hotels,
                request_id: hotels?.request_id ?? request_id,
                readyOperators: hotels?.readyOperators ?? readyOperators,
                ...sanitizeListingFilterParams(appliedFilters),
                ui_page_number: parseUiPageNumber(page_number),
            };
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
                clearActiveSearchPoll();
                state.loading = true;
                state.error = null;
                state.loadMore = false;
                // New search started: clear the previous list so only skeletons show.
                state.hotels = null;
                state.allMyHotels = [];
                state.progress = {};
            })
            .addCase(runFullSearchFlow.fulfilled, (state, action) => {
                state.hotels = action.payload;
                state.loading = false;
                state.loadMore = false;
                state.allMyHotels = action.payload.hotels || [];
            })
            .addCase(runFullSearchFlow.rejected, (state, action) => {
                if (action.error?.message === SEARCH_POLL_CANCELLED) {
                    return;
                }
                state.loading = false;
                state.error = action.payload as string;
            })
            .addCase(searchFilters.pending, (state, action) => {
                clearActiveSearchPoll();
                state.loading = true;
                state.error = null;
                state.progress = {};
                const pageNumber = parseUiPageNumber(action.meta?.arg?.page_number);
                if (pageNumber === 1 && !state.loadMore) {
                    state.allMyHotels = [];
                }
            })
            .addCase(searchFilters.fulfilled, (state, action) => {
                state.hotels = action.payload;
                state.loading = false;
                state.loadMore = false;
                const pageNumber = parseUiPageNumber(
                    action.meta?.arg?.page_number ?? action.payload.ui_page_number,
                );
                const hotels = action.payload.hotels || [];

                if (pageNumber === 1) {
                    state.allMyHotels = hotels;
                } else {
                    state.allMyHotels = mergeHotelPages(state.allMyHotels || [], hotels);
                }
            })
            .addCase(searchFilters.rejected, (state, action) => {
                state.loading = false;
                state.loadMore = false;
                state.error = action.payload as string;
            })
    },
});

export const { updateProgress, clearSearch,setHeaderName,setStartSearch,setLoadMore,setAllMyHotels } = searchSlice.actions;

export default searchSlice.reducer;
