// store/slices/searchSlice.ts
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import {checkSearchStatus, getGroupedHotels, startSearch} from "@/api/levelTravelApi";

interface SearchState {
    hotels: any;
    progress: Record<string, string>;
    loading: boolean;
    error: string | null;
    requestId: string | null | undefined;
    operators: [string] | [];
}

const initialState: SearchState = {
    hotels: null,
    progress: {},
    loading: false,
    error: null,
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

                            const hotels = await getGroupedHotels(filters);
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
        clearSearch(state) {
            state.hotels = null;
            state.progress = {};
            state.loading = false;
            state.error = null;
            // state.requestId = '';
        },
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
            })
            .addCase(searchFilters.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload as string;
            })
    },
});

export const { updateProgress, clearSearch } = searchSlice.actions;

export default searchSlice.reducer;
