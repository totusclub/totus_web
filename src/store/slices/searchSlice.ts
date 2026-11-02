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
import { mergeHotelPages, parseUiPageNumber, toOperatorIdsCsv } from '@/utils/searchResults';
import {
    getReadySearchOperators,
    shouldStopSearchPolling,
} from '@/utils/searchStatus';
import { pickAppliedFiltersFromHotels, sanitizeListingFilterParams } from '@/utils/searchListState';
import {
    PROGRESSIVE_SEARCH_ENABLED,
    appendUniqueHotels,
    getVisibleHotelCount,
    mergeProgressiveHotels,
    runProgressiveSearch,
} from '@/utils/progressiveSearch';

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

// Постепенная выдача (utils/progressiveSearch.ts): id текущего поиска (requestId thunk-а).
// Новый поиск или уход со страницы обнуляет его — цикл старого поиска сам останавливается.
let activeProgressiveId: string | null = null;

export function stopActiveSearchPoll() {
    activeProgressiveId = null;
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
    /** Постепенная выдача: id текущего поиска; ответы других поисков выбрасываются. */
    activeSearchId?: string | null;
    /** Сколько операторов ещё ищут (null — поиск не идёт). «Ищем ещё у N операторов». */
    searchingOperators?: number | null;
    /** Запрос фильтра / сортировки: прежний список виден, пока не придёт новый. */
    refreshing?: boolean;
    /** Последний запрос фильтра первой страницы — более ранние ответы выбрасываются. */
    filterRequestId?: string | null;
}

const initialState: SearchState = {
    hotels: null,
    progress: {},
    loading: false,
    error: null,
    headerName:'',
    startSearchValid:true,
    loadMore:false,
    allMyHotels:[],
    activeSearchId: null,
    searchingOperators: null,
    refreshing: false,
    filterRequestId: null,
};

/** Параметры выдачи из формы поиска: без ответа LT и без замороженных операторов. */
function listParamsFromFilterParams(filterParams: unknown): Record<string, unknown> {
    if (!filterParams || typeof filterParams !== 'object') return {};
    const {
        hotels: _h,
        hotels_count: _hc,
        filters: _f,
        status: _s,
        request_id: _r,
        readyOperators: _ro,
        operator_ids: _oi,
        ui_page_number: _u,
        page_number: _pn,
        ...rest
    } = filterParams as Record<string, unknown>;
    return rest;
}

// Постепенная выдача: первая страница с первого опроса, без operator_ids, дозапрос по мере поиска.
async function runProgressiveFlow(
    { searchParams, filterParams }: { searchParams: any | null; filterParams?: any | null },
    thunkApi: { dispatch: any; getState: () => unknown; requestId: string; rejectWithValue: (v: string) => any },
) {
    const { dispatch, getState, requestId, rejectWithValue } = thunkApi;
    clearActiveSearchPoll();
    activeProgressiveId = requestId;
    const isCurrent = () => activeProgressiveId === requestId;
    const initialListParams = listParamsFromFilterParams(filterParams);
    const searchState = () => (getState() as { search: SearchState }).search;

    try {
        const result = await runProgressiveSearch({
            searchParams,
            startSearch,
            checkStatus: checkSearchStatus,
            fetchPage: getGroupedHotels,
            isCurrent,
            isListBusy: () => Boolean(searchState().refreshing),
            getListParams: () => {
                const hotels = searchState().hotels;
                // После первой страницы фильтры и сортировка живут в hotels (их меняет человек).
                const applied = hotels ? pickAppliedFiltersFromHotels(hotels) : {};
                return {
                    ...initialListParams,
                    ...applied,
                    page_limit: Math.max(1, Number(initialListParams.page_limit) || 50),
                };
            },
            onStatus: ({ statusMap, operatorsLeft }) => {
                dispatch(progressiveStatus({ searchId: requestId, statusMap, operatorsLeft }));
            },
            onPage: (page, { first, final, listParams }) => {
                const {
                    request_id: _rid,
                    page_number: _pn,
                    page_limit: _pl,
                    ...applied
                } = listParams;
                dispatch(progressivePage({
                    searchId: requestId,
                    first,
                    final,
                    frozenCount: first ? 0 : getVisibleHotelCount(),
                    page: {
                        ...page,
                        request_id: page?.request_id ?? listParams.request_id,
                        ...sanitizeListingFilterParams(applied),
                        ui_page_number: 1,
                    },
                }));
            },
        });
        if (isCurrent()) activeProgressiveId = null;
        return { progressive: true, ...result };
    } catch (err: any) {
        if (!isCurrent()) return { progressive: true, outcome: 'cancelled' };
        activeProgressiveId = null;
        return rejectWithValue(err?.message || 'Failed to complete search');
    }
}

// Thunk
export const runFullSearchFlow = createAsyncThunk(
    'search/runFullSearchFlow',
    async (
        {
            searchParams,
            filterParams,
        }: { searchParams: any | null; filterParams?: any | null },
        { rejectWithValue, dispatch, getState, requestId }
    ) => {
        if (PROGRESSIVE_SEARCH_ENABLED) {
            return runProgressiveFlow({ searchParams, filterParams }, { dispatch, getState, requestId, rejectWithValue });
        }
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
                        const readyOperatorsCsv = toOperatorIdsCsv(readyOperators);

                        let filters: Record<string, unknown> = { request_id };
                        if (readyOperatorsCsv) {
                            filters.readyOperators = readyOperatorsCsv;
                        }
                        if (filterParams && typeof filterParams === 'object') {
                            const {
                                hotels: _h,
                                hotels_count: _hc,
                                filters: _f,
                                status: _s,
                                request_id: _r,
                                readyOperators: _ro,
                                ...safeFilterParams
                            } = filterParams as Record<string, unknown>;
                            filters = { ...filters, ...safeFilterParams };
                        }

                        const hotels = await getGroupedHotels({
                            ...filters,
                            page_number: parseUiPageNumber(filters.page_number),
                            page_limit: Math.max(1, Number(filters.page_limit) || 50),
                        });
                        const {
                            hotels: _fh,
                            hotels_count: _fhc,
                            filters: _ff,
                            status: _fs,
                            request_id: _fr,
                            readyOperators: _fro,
                            ...appliedFilterMeta
                        } = (filterParams && typeof filterParams === 'object'
                            ? filterParams
                            : {}) as Record<string, unknown>;
                        resolve({
                            ...hotels,
                            request_id,
                            // Always CSV — array becomes readyOperators=6&readyOperators=7 in axios.
                            readyOperators: readyOperatorsCsv || toOperatorIdsCsv(hotels?.readyOperators),
                            ...appliedFilterMeta,
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
        // Постепенная выдача: фильтр во время поиска не останавливает поиск.
        if (!PROGRESSIVE_SEARCH_ENABLED) clearActiveSearchPoll();

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
                readyOperators: toOperatorIdsCsv(
                    hotels?.readyOperators ?? readyOperators,
                ),
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
            state.searchingOperators = null;
            state.refreshing = false;
            state.filterRequestId = null;
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
        progressiveStatus(state, action) {
            if (action.payload?.searchId !== state.activeSearchId) return;
            state.progress = action.payload.statusMap || {};
            state.searchingOperators = Number(action.payload.operatorsLeft) || 0;
        },
        progressivePage(state, action) {
            const { searchId, first, final, frozenCount, page } = action.payload || {};
            if (searchId !== state.activeSearchId) return;
            // Идёт запрос фильтра / сортировки — его ответ заменит список.
            if (state.refreshing) return;
            const incoming = page?.hotels || [];
            if (first || state.hotels == null) {
                state.hotels = page;
                state.allMyHotels = incoming;
            } else {
                state.hotels = { ...page, ui_page_number: state.hotels?.ui_page_number ?? 1 };
                state.allMyHotels = mergeProgressiveHotels(state.allMyHotels as any[], incoming, {
                    sortBy: page?.sort_by,
                    frozenCount,
                }) as any;
            }
            // Идёт догрузка следующей страницы — её флаг загрузки не трогаем.
            if (!state.loadMore) state.loading = false;
            state.error = null;
            if (final) state.searchingOperators = null;
        },
        setAllMyHotels(state, action) {
            // Постепенная выдача: список очищают только перед запросом фильтра / сортировки
            // (filters.tsx, resultList.tsx). Теперь он остаётся на экране до ответа (refreshing) —
            // без заглушек и мигания; ответ запроса заменит его целиком.
            const nextList = Array.isArray(action.payload) ? action.payload : action.payload?.hotels;
            if (PROGRESSIVE_SEARCH_ENABLED && (!nextList || nextList.length === 0)) return;
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
            .addCase(runFullSearchFlow.pending, (state, action) => {
                clearActiveSearchPoll();
                state.activeSearchId = action.meta.requestId;
                state.searchingOperators = null;
                state.refreshing = false;
                state.filterRequestId = null;
                state.loading = true;
                state.error = null;
                state.loadMore = false;
                // New search started: clear the previous list so only skeletons show.
                state.hotels = null;
                state.allMyHotels = [];
                state.progress = {};
            })
            .addCase(runFullSearchFlow.fulfilled, (state, action) => {
                if ((action.payload as any)?.progressive) {
                    // Список уже собран progressivePage; здесь только конец поиска.
                    if (action.meta.requestId !== state.activeSearchId) return;
                    state.loading = false;
                    state.searchingOperators = null;
                    return;
                }
                state.hotels = action.payload;
                state.loading = false;
                state.loadMore = false;
                state.allMyHotels = action.payload.hotels || [];
            })
            .addCase(runFullSearchFlow.rejected, (state, action) => {
                if (action.error?.message === SEARCH_POLL_CANCELLED) {
                    return;
                }
                if (PROGRESSIVE_SEARCH_ENABLED && action.meta.requestId !== state.activeSearchId) return;
                state.searchingOperators = null;
                state.loading = false;
                state.error = action.payload as string;
            })
            .addCase(searchFilters.pending, (state, action) => {
                if (PROGRESSIVE_SEARCH_ENABLED) {
                    const page = parseUiPageNumber(action.meta?.arg?.page_number);
                    state.error = null;
                    if (page <= 1 && !state.loadMore) {
                        state.filterRequestId = action.meta.requestId;
                        // Список уже есть — оставляем его на экране до ответа (без заглушек и мигания).
                        if ((state.allMyHotels?.length || 0) > 0) {
                            state.refreshing = true;
                            return;
                        }
                    }
                    state.loading = true;
                    return;
                }
                clearActiveSearchPoll();
                state.loading = true;
                state.error = null;
                state.progress = {};
                const pageNumber = parseUiPageNumber(action.meta?.arg?.page_number);
                // Append path: load-more sets loadMore before dispatch. Never clear the list then.
                if (pageNumber <= 1 && !state.loadMore) {
                    state.allMyHotels = [];
                }
            })
            .addCase(searchFilters.fulfilled, (state, action) => {
                if (PROGRESSIVE_SEARCH_ENABLED) {
                    const page = parseUiPageNumber(action.meta?.arg?.page_number);
                    const list = action.payload?.hotels || [];
                    if (page <= 1) {
                        // Ответ более раннего клика по фильтру — не нужен.
                        if (state.filterRequestId && action.meta.requestId !== state.filterRequestId) return;
                        state.hotels = action.payload;
                        state.allMyHotels = list;
                    } else {
                        // Догрузка страницы другого (старого) поиска — не нужна.
                        if (state.hotels?.request_id && action.payload?.request_id !== state.hotels.request_id) {
                            state.loading = false;
                            state.loadMore = false;
                            return;
                        }
                        state.hotels = action.payload;
                        state.allMyHotels = appendUniqueHotels(state.allMyHotels as any[], list) as any;
                    }
                    state.loading = false;
                    state.loadMore = false;
                    state.refreshing = false;
                    return;
                }
                const requestedPage = parseUiPageNumber(action.meta?.arg?.page_number);
                state.hotels = action.payload;
                state.loading = false;
                state.loadMore = false;
                const hotels = action.payload.hotels || [];

                if (requestedPage > 1) {
                    state.allMyHotels = mergeHotelPages(state.allMyHotels || [], hotels);
                } else {
                    state.allMyHotels = hotels;
                }
            })
            .addCase(searchFilters.rejected, (state, action) => {
                if (PROGRESSIVE_SEARCH_ENABLED) {
                    const page = parseUiPageNumber(action.meta?.arg?.page_number);
                    if (page <= 1 && state.filterRequestId && action.meta.requestId !== state.filterRequestId) return;
                    state.refreshing = false;
                }
                state.loading = false;
                state.loadMore = false;
                state.error = action.payload as string;
            })
    },
});

export const { updateProgress, clearSearch,setHeaderName,setStartSearch,setLoadMore,setAllMyHotels, progressiveStatus, progressivePage } = searchSlice.actions;

export default searchSlice.reducer;
