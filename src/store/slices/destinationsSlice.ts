import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';
import { API_BASE_URL } from '@/config/api';

/** Autocomplete misses some English spellings (e.g. "turkish") — map to a known query. */
const DESTINATION_QUERY_ALIASES: Record<string, string> = {
    turkish: 'Турция',
    turkye: 'Турция',
    turkiye: 'Турция',
    türkiye: 'Турция',
    туркиш: 'Турция',
    турецкая: 'Турция',
    турецкий: 'Турция',
};

function normalizeDestinationQuery(query: unknown): string {
    const raw = String(query ?? '').trim();
    if (!raw) return '';
    const alias = DESTINATION_QUERY_ALIASES[raw.toLowerCase()];
    return alias || raw;
}

export const fetchDestinations = createAsyncThunk(
    'destinations/fetchDestinations',
    async (params: { query?: string; from_city?: string; search_type?: string } = {}) => {
        const searchType = params?.search_type === 'hotel' ? 'hotel' : 'package';
        const query = normalizeDestinationQuery(params.query);
        const res = await axios.get(`${API_BASE_URL}/references/autocomplete_v2`, {
            params: {
                // Empty query: space keeps popular countries (incl. Turkey) in the list.
                query: query || ' ',
                from_city: params?.from_city || 'Moscow',
                search_type: searchType,
            },
        });
        return res.data;
    }
);

const destinationsSlice = createSlice({
    name: 'destinations',
    initialState: {
        data: [],
        status: 'idle',
        error: null,
    },
    reducers: {},
    extraReducers: builder => {
        builder
            .addCase(fetchDestinations.pending, state => {
                state.status = 'loading';
            })
            .addCase(fetchDestinations.fulfilled, (state, action) => {
                state.status = 'succeeded';
                state.data = action.payload;
            })
            .addCase(fetchDestinations.rejected, (state, action) => {
                state.status = 'failed';
                state.error = action.error.message;
            });
    },
});

export default destinationsSlice.reducer;
