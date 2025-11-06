import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

export const fetchDestinations = createAsyncThunk(
    'destinations/fetchDestinations',
    async (params = {}) => {
        // query:'""',from_city:from_city,search_type:'package'
        const res = await axios.get(`https://api.totus.club/references/autocomplete_v2?query="${params.query}"&from_city=${params?.from_city}&search_type=package` );
        // const res = await axios.get('https://api.totus.club/references/destinations', { params });
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
