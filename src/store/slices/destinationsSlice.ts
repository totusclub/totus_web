import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

export const fetchDestinations = createAsyncThunk(
    'destinations/fetchDestinations',
    async (params = {}) => {
        // const res = await axios.get('http://localhost:3001/references/autocomplete_v2', {params} );
        const res = await axios.get('https://api.totus.club/references/destinations', { params });
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
