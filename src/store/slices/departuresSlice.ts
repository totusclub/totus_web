import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';
import { API_BASE_URL } from '@/config/api';

export const fetchDepartures = createAsyncThunk(
    'departures/fetchDepartures',
    async () => {
        // Full departures list (do not limit with prioritized_count).
        const res = await axios.get(`${API_BASE_URL}/references/departures`);
        return res.data;
    }
);

const departuresSlice = createSlice({
    name: 'departures',
    initialState: {
        data: [],
        status: 'idle',
        error: null,
    },
    reducers: {},
    extraReducers: builder => {
        builder
            .addCase(fetchDepartures.pending, state => {
                state.status = 'loading';
            })
            .addCase(fetchDepartures.fulfilled, (state, action) => {
                state.status = 'succeeded';
                state.data = action.payload;
            })
            .addCase(fetchDepartures.rejected, (state, action) => {
                state.status = 'failed';
                state.error = action.error.message;
            });
    },
});

export default departuresSlice.reducer;
