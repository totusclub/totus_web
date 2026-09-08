import { createAsyncThunk, createSlice, type PayloadAction } from '@reduxjs/toolkit';
import {
    deleteNotification,
    getNotifications,
    getSettings,
    getUnread,
    markOpened,
    markRead,
    notificationsErrorMessage,
    updateSettings,
    type NotificationCategory,
    type NotificationEvent,
    type NotificationItem,
    type NotificationSettings,
    type PushDevice,
    type UpdateSettingsParams,
} from '@/api/notificationsApi';
import type { WebPushStatus } from '@/lib/webPush';

export type NotificationsLoadStatus = 'idle' | 'loading' | 'ready' | 'error';

/** Фильтр списка: «Все» или категория хаба. */
export type NotificationsFilter = 'all' | NotificationCategory;

export const PAGE_SIZE = 30;

export interface NotificationsState {
    items: NotificationItem[];
    hasMore: boolean;
    unread: number;
    status: NotificationsLoadStatus;
    loadingMore: boolean;
    error: string | null;
    filter: NotificationsFilter;
    settings: NotificationSettings | null;
    devices: PushDevice[];
    settingsStatus: NotificationsLoadStatus;
    settingsError: string | null;
    savingSettings: boolean;
    /** Состояние Web Push в этом браузере (обновляет NotificationsBridge / страница настроек) */
    push: WebPushStatus & { busy: boolean; error: string | null };
}

const initialState: NotificationsState = {
    items: [],
    hasMore: false,
    unread: 0,
    status: 'idle',
    loadingMore: false,
    error: null,
    filter: 'all',
    settings: null,
    devices: [],
    settingsStatus: 'idle',
    settingsError: null,
    savingSettings: false,
    push: { supported: false, permission: 'unsupported', subscribed: false, needsPwa: false, busy: false, error: null },
};

type ThunkState = { notifications: NotificationsState };

function sortItems(list: NotificationItem[]): NotificationItem[] {
    return [...list].sort((a, b) => b.id - a.id);
}

function mergeItems(existing: NotificationItem[], incoming: NotificationItem[]): NotificationItem[] {
    const map = new Map<number, NotificationItem>();
    for (const item of existing) map.set(item.id, item);
    for (const item of incoming) map.set(item.id, item);
    return sortItems(Array.from(map.values()));
}

function matchesFilter(item: NotificationItem, filter: NotificationsFilter): boolean {
    return filter === 'all' || item.category === filter;
}

/** Первая страница списка по текущему фильтру (или переданному). */
export const fetchNotifications = createAsyncThunk<
    { items: NotificationItem[]; hasMore: boolean; unread: number; filter: NotificationsFilter },
    { filter?: NotificationsFilter } | undefined,
    { state: ThunkState; rejectValue: string }
>('notifications/fetch', async (arg, { getState, rejectWithValue }) => {
    const filter = arg?.filter ?? getState().notifications.filter;
    try {
        const data = await getNotifications({
            limit: PAGE_SIZE,
            category: filter === 'all' ? null : filter,
        });
        return { ...data, filter };
    } catch (error) {
        return rejectWithValue(notificationsErrorMessage(error));
    }
});

/** Догрузка «Показать ещё» (before = id последнего). */
export const fetchMoreNotifications = createAsyncThunk<
    { items: NotificationItem[]; hasMore: boolean; unread: number },
    void,
    { state: ThunkState; rejectValue: string }
>('notifications/fetchMore', async (_, { getState, rejectWithValue }) => {
    const { items, filter } = getState().notifications;
    const last = items[items.length - 1];
    try {
        return await getNotifications({
            before: last ? last.id : null,
            limit: PAGE_SIZE,
            category: filter === 'all' ? null : filter,
        });
    } catch (error) {
        return rejectWithValue(notificationsErrorMessage(error));
    }
});

export const fetchUnread = createAsyncThunk<number, void, { rejectValue: string }>(
    'notifications/fetchUnread',
    async (_, { rejectWithValue }) => {
        try {
            return await getUnread();
        } catch (error) {
            return rejectWithValue(notificationsErrorMessage(error));
        }
    },
);

export const markNotificationsRead = createAsyncThunk<
    { ids: number[] | 'all'; unread: number },
    number[] | 'all',
    { rejectValue: string }
>('notifications/markRead', async (target, { rejectWithValue }) => {
    try {
        const result = await markRead(target);
        return { ids: target, unread: result.unread };
    } catch (error) {
        return rejectWithValue(notificationsErrorMessage(error));
    }
});

/** Тап по элементу/пушу: POST /api/notifications/opened (помечает прочитанным). */
export const markNotificationOpened = createAsyncThunk<
    { id: number; unread: number },
    number,
    { rejectValue: string }
>('notifications/markOpened', async (id, { rejectWithValue }) => {
    try {
        const result = await markOpened(id);
        return { id, unread: result.unread };
    } catch (error) {
        return rejectWithValue(notificationsErrorMessage(error));
    }
});

export const removeNotification = createAsyncThunk<number, number, { rejectValue: string }>(
    'notifications/remove',
    async (id, { rejectWithValue }) => {
        try {
            await deleteNotification(id);
            return id;
        } catch (error) {
            return rejectWithValue(notificationsErrorMessage(error));
        }
    },
);

export const fetchSettings = createAsyncThunk<
    { settings: NotificationSettings; devices: PushDevice[] },
    void,
    { rejectValue: string }
>('notifications/fetchSettings', async (_, { rejectWithValue }) => {
    try {
        return await getSettings();
    } catch (error) {
        return rejectWithValue(notificationsErrorMessage(error));
    }
});

export const saveSettings = createAsyncThunk<
    { settings: NotificationSettings; devices: PushDevice[] },
    UpdateSettingsParams,
    { rejectValue: string }
>('notifications/saveSettings', async (params, { rejectWithValue }) => {
    try {
        return await updateSettings(params);
    } catch (error) {
        return rejectWithValue(notificationsErrorMessage(error));
    }
});

const notificationsSlice = createSlice({
    name: 'notifications',
    initialState,
    reducers: {
        setFilter(state, action: PayloadAction<NotificationsFilter>) {
            if (state.filter !== action.payload) {
                state.filter = action.payload;
                state.items = [];
                state.hasMore = false;
                state.status = 'idle';
                state.error = null;
            }
        },
        setUnread(state, action: PayloadAction<number>) {
            state.unread = Math.max(0, Number(action.payload) || 0);
        },
        /** Событие сокета notify:new — в начало списка (если подходит под фильтр) + unread + 1 */
        addIncoming(state, action: PayloadAction<NotificationEvent>) {
            const event = action.payload;
            if (!event || typeof event.id !== 'number') return;
            const exists = state.items.some((item) => item.id === event.id);
            if (!exists) {
                state.unread += 1;
                const item: NotificationItem = {
                    id: event.id,
                    type: event.type,
                    category: event.category,
                    title: event.title,
                    body: event.body,
                    data: event.data ?? null,
                    source: null,
                    readAt: null,
                    openedAt: null,
                    createdAt: event.createdAt || new Date().toISOString(),
                };
                if (state.status === 'ready' && matchesFilter(item, state.filter)) {
                    state.items = sortItems([item, ...state.items]);
                }
            }
        },
        setPushStatus(state, action: PayloadAction<Partial<NotificationsState['push']>>) {
            state.push = { ...state.push, ...action.payload };
        },
        /** Локально пометить прочитанным (оптимистично, до ответа сервера) */
        markReadLocal(state, action: PayloadAction<number[] | 'all'>) {
            const now = new Date().toISOString();
            if (action.payload === 'all') {
                for (const item of state.items) if (!item.readAt) item.readAt = now;
                state.unread = 0;
                return;
            }
            const ids = new Set(action.payload);
            let count = 0;
            for (const item of state.items) {
                if (ids.has(item.id) && !item.readAt) {
                    item.readAt = now;
                    count += 1;
                }
            }
            state.unread = Math.max(0, state.unread - count);
        },
        reset() {
            return initialState;
        },
    },
    extraReducers: (builder) => {
        builder
            .addCase(fetchNotifications.pending, (state) => {
                state.status = 'loading';
                state.error = null;
            })
            .addCase(fetchNotifications.fulfilled, (state, action) => {
                if (action.payload.filter !== state.filter) return; // фильтр сменили во время запроса
                state.items = sortItems(action.payload.items);
                state.hasMore = action.payload.hasMore;
                state.unread = action.payload.unread;
                state.status = 'ready';
                state.error = null;
            })
            .addCase(fetchNotifications.rejected, (state, action) => {
                state.status = 'error';
                state.error = action.payload || notificationsErrorMessage(action.error?.message);
            })
            .addCase(fetchMoreNotifications.pending, (state) => {
                state.loadingMore = true;
            })
            .addCase(fetchMoreNotifications.fulfilled, (state, action) => {
                state.loadingMore = false;
                state.items = mergeItems(state.items, action.payload.items);
                state.hasMore = action.payload.hasMore;
                state.unread = action.payload.unread;
            })
            .addCase(fetchMoreNotifications.rejected, (state, action) => {
                state.loadingMore = false;
                state.error = action.payload || notificationsErrorMessage(action.error?.message);
            })
            .addCase(fetchUnread.fulfilled, (state, action) => {
                state.unread = action.payload;
            })
            .addCase(markNotificationsRead.fulfilled, (state, action) => {
                const now = new Date().toISOString();
                if (action.payload.ids === 'all') {
                    for (const item of state.items) if (!item.readAt) item.readAt = now;
                } else {
                    const ids = new Set(action.payload.ids);
                    for (const item of state.items) if (ids.has(item.id) && !item.readAt) item.readAt = now;
                }
                state.unread = action.payload.unread;
            })
            .addCase(markNotificationOpened.pending, (state, action) => {
                const item = state.items.find((n) => n.id === action.meta.arg);
                if (item && !item.readAt) {
                    item.readAt = new Date().toISOString();
                    state.unread = Math.max(0, state.unread - 1);
                }
            })
            .addCase(markNotificationOpened.fulfilled, (state, action) => {
                const now = new Date().toISOString();
                const item = state.items.find((n) => n.id === action.payload.id);
                if (item) {
                    if (!item.readAt) item.readAt = now;
                    if (!item.openedAt) item.openedAt = now;
                }
                state.unread = action.payload.unread;
            })
            .addCase(removeNotification.fulfilled, (state, action) => {
                const removed = state.items.find((n) => n.id === action.payload);
                state.items = state.items.filter((n) => n.id !== action.payload);
                if (removed && !removed.readAt) state.unread = Math.max(0, state.unread - 1);
            })
            .addCase(fetchSettings.pending, (state) => {
                state.settingsStatus = 'loading';
                state.settingsError = null;
            })
            .addCase(fetchSettings.fulfilled, (state, action) => {
                state.settings = action.payload.settings;
                state.devices = action.payload.devices;
                state.settingsStatus = 'ready';
                state.settingsError = null;
            })
            .addCase(fetchSettings.rejected, (state, action) => {
                state.settingsStatus = 'error';
                state.settingsError = action.payload || notificationsErrorMessage(action.error?.message);
            })
            .addCase(saveSettings.pending, (state, action) => {
                state.savingSettings = true;
                state.settingsError = null;
                // оптимистично
                if (state.settings) {
                    const { prefs, email, sound } = action.meta.arg;
                    if (prefs) state.settings.prefs = { ...state.settings.prefs, ...prefs };
                    if (typeof email === 'boolean') state.settings.email = email;
                    if (typeof sound === 'boolean') state.settings.sound = sound;
                }
            })
            .addCase(saveSettings.fulfilled, (state, action) => {
                state.savingSettings = false;
                if (action.payload.settings) state.settings = action.payload.settings;
                if (action.payload.devices) state.devices = action.payload.devices;
            })
            .addCase(saveSettings.rejected, (state, action) => {
                state.savingSettings = false;
                state.settingsError = action.payload || notificationsErrorMessage(action.error?.message);
            });
    },
});

export const { setFilter, setUnread, addIncoming, setPushStatus, markReadLocal, reset } =
    notificationsSlice.actions;

export default notificationsSlice.reducer;
