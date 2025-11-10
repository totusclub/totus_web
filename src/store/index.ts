import { configureStore } from '@reduxjs/toolkit';
import { createWrapper } from 'next-redux-wrapper';
import counterReducer from './slices/counterSlice';
import departuresReducer from './slices/departuresSlice';
import destinationsReducer from './slices/destinationsSlice';
import searchReducer from './slices/searchSlice';
import authReducer from './slices/authSlice';
import chatReducer from './slices/chat/chatSlice';

const makeStore = () =>
    configureStore({
        reducer: {
            counter: counterReducer,
            departures: departuresReducer,
            destinations: destinationsReducer,
            search: searchReducer,
            auth: authReducer,
            chat: chatReducer,
        },
    });

export type AppStore = ReturnType<typeof makeStore>;
export type RootState = ReturnType<AppStore['getState']>;
export type AppDispatch = AppStore['dispatch'];

export const wrapper = createWrapper<AppStore>(makeStore);
