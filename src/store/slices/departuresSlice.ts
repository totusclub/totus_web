import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

export const fetchDepartures = createAsyncThunk(
    'departures/fetchDepartures',
    async (params = {}) => {
        const res = await axios.get('https://api.totus.club/references/departures?prioritized_count=10', { prioritized_count:10 });
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
