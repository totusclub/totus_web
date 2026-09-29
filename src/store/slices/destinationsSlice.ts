import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';
import { API_BASE_URL } from '@/config/api';
import { searchWithLayoutFallback } from '@/utils/search/searchCandidates';

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

interface DestinationGroup {
    group_name?: string;
    results?: unknown[];
}

/** Автокомплит вернул хоть что-то: в какой-либо группе есть результаты. */
function hasDestinationResults(data: unknown): boolean {
    return (
        Array.isArray(data) &&
        data.some((group: DestinationGroup) => Array.isArray(group?.results) && group.results.length > 0)
    );
}

export const fetchDestinations = createAsyncThunk(
    'destinations/fetchDestinations',
    async (params: { query?: string; from_city?: string; search_type?: string } = {}) => {
        const searchType = params?.search_type === 'hotel' ? 'hotel' : 'package';
        const request = async (q: string) => {
            const query = normalizeDestinationQuery(q);
            const res = await axios.get(`${API_BASE_URL}/references/autocomplete_v2`, {
                params: {
                    // Empty query: space keeps popular countries (incl. Turkey) in the list.
                    query: query || ' ',
                    from_city: params?.from_city || 'Moscow',
                    search_type: searchType,
                },
            });
            return res.data;
        };
        // Сначала ищем по введённому тексту; если он набран в неправильной раскладке
        // («nehwbz» вместо «турция»), дополнительно ищем по варианту в другой раскладке.
        // Текст в поле ввода при этом не меняется.
        const { result, candidate } = await searchWithLayoutFallback(
            String(params.query ?? '').trim(),
            request,
            hasDestinationResults,
        );
        return {
            data: result,
            /** Запрос, по которому найдены показанные результаты (может отличаться от введённого). */
            usedQuery: candidate.query,
            layoutCorrected: candidate.source !== 'original',
        };
    }
);

const destinationsSlice = createSlice({
    name: 'destinations',
    initialState: {
        data: [] as unknown[],
        status: 'idle',
        error: null as string | null,
        usedQuery: '',
        layoutCorrected: false,
        requestId: null as string | null,
    },
    reducers: {},
    extraReducers: builder => {
        builder
            .addCase(fetchDestinations.pending, (state, action) => {
                state.status = 'loading';
                state.requestId = action.meta.requestId;
            })
            .addCase(fetchDestinations.fulfilled, (state, action) => {
                // Ответ на устаревший запрос (пользователь продолжил печатать) не показываем.
                if (state.requestId !== action.meta.requestId) return;
                state.status = 'succeeded';
                state.data = action.payload.data;
                state.usedQuery = action.payload.usedQuery;
                state.layoutCorrected = action.payload.layoutCorrected;
            })
            .addCase(fetchDestinations.rejected, (state, action) => {
                if (state.requestId !== action.meta.requestId) return;
                state.status = 'failed';
                state.error = action.error.message ?? null;
            });
    },
});

export default destinationsSlice.reducer;
