import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { SupportChat, SupportHours, SupportMessage } from '@/api/supportChatApi';

export type SupportChatLoadStatus = 'idle' | 'loading' | 'ready' | 'error';

/** Сообщение в ленте: серверное либо оптимистичное (pending/failed) до подтверждения. */
export interface SupportChatMessage extends SupportMessage {
    pending?: boolean;
    failed?: boolean;
    error?: string | null;
}

export interface SupportChatState {
    chat: SupportChat | null;
    messages: SupportChatMessage[];
    hasMore: boolean;
    hours: SupportHours | null;
    unreadCount: number;
    status: SupportChatLoadStatus;
    error: string | null;
    /** Оператор печатает */
    typing: boolean;
}

const initialState: SupportChatState = {
    chat: null,
    messages: [],
    hasMore: false,
    hours: null,
    unreadCount: 0,
    status: 'idle',
    error: null,
    typing: false,
};

function sortMessages(list: SupportChatMessage[]): SupportChatMessage[] {
    // Серверные — по id, оптимистичные (id < 0) — в конец по времени создания
    return [...list].sort((a, b) => {
        const aOpt = a.id < 0;
        const bOpt = b.id < 0;
        if (aOpt !== bOpt) return aOpt ? 1 : -1;
        if (aOpt && bOpt) return a.createdAt.localeCompare(b.createdAt);
        return a.id - b.id;
    });
}

function findIndexByMessage(list: SupportChatMessage[], message: SupportMessage): number {
    const byId = list.findIndex((m) => m.id === message.id);
    if (byId !== -1) return byId;
    if (message.clientMsgId) {
        return list.findIndex((m) => m.clientMsgId === message.clientMsgId);
    }
    return -1;
}

const supportChatSlice = createSlice({
    name: 'supportChat',
    initialState,
    reducers: {
        setStatus(state, action: PayloadAction<SupportChatLoadStatus>) {
            state.status = action.payload;
            if (action.payload !== 'error') state.error = null;
        },
        setError(state, action: PayloadAction<string | null>) {
            state.error = action.payload;
            state.status = 'error';
        },
        /** Первичная загрузка GET /api/support/chat */
        setChat(
            state,
            action: PayloadAction<{
                chat: SupportChat;
                messages: SupportMessage[];
                hasMore: boolean;
                hours?: SupportHours | null;
            }>,
        ) {
            const { chat, messages, hasMore, hours } = action.payload;
            // оставляем локальные неотправленные сообщения
            const local = state.messages.filter((m) => m.id < 0);
            state.chat = chat;
            state.messages = sortMessages([...messages, ...local]);
            state.hasMore = hasMore;
            state.hours = hours ?? state.hours;
            state.unreadCount = Number(chat?.userUnread || 0);
            state.status = 'ready';
            state.error = null;
        },
        /** Обновление объекта chat (support:chat-updated, ответы send/read) */
        setChatInfo(state, action: PayloadAction<SupportChat | null | undefined>) {
            if (action.payload) state.chat = action.payload;
        },
        /** Страница истории вверх */
        prependMessages(state, action: PayloadAction<{ messages: SupportMessage[]; hasMore: boolean }>) {
            const existing = new Set(state.messages.map((m) => m.id));
            const fresh = action.payload.messages.filter((m) => !existing.has(m.id));
            state.messages = sortMessages([...fresh, ...state.messages]);
            state.hasMore = action.payload.hasMore;
        },
        /** Новое сообщение (сокет / ответ REST). Дедуп по id и clientMsgId. */
        appendMessage(state, action: PayloadAction<SupportMessage>) {
            const message = action.payload;
            const index = findIndexByMessage(state.messages, message);
            if (index !== -1) {
                state.messages[index] = { ...message, pending: false, failed: false, error: null };
            } else {
                state.messages.push({ ...message });
            }
            state.messages = sortMessages(state.messages);
            if (message.senderRole !== 'user') {
                state.typing = false;
            }
        },
        addOptimistic(state, action: PayloadAction<SupportChatMessage>) {
            const index = findIndexByMessage(state.messages, action.payload);
            if (index === -1) {
                state.messages.push({ ...action.payload, pending: true, failed: false, error: null });
            } else {
                state.messages[index] = { ...state.messages[index], pending: true, failed: false, error: null };
            }
        },
        confirmOptimistic(state, action: PayloadAction<{ clientMsgId: string; message: SupportMessage }>) {
            const { clientMsgId, message } = action.payload;
            const optIndex = state.messages.findIndex((m) => m.clientMsgId === clientMsgId && m.id < 0);
            const realIndex = state.messages.findIndex((m) => m.id === message.id);
            if (realIndex !== -1 && optIndex !== -1) {
                // сокет уже принёс серверное сообщение — убираем оптимистичный дубль
                state.messages.splice(optIndex, 1);
            } else if (optIndex !== -1) {
                state.messages[optIndex] = { ...message, pending: false, failed: false, error: null };
            } else if (realIndex === -1) {
                state.messages.push({ ...message });
            }
            state.messages = sortMessages(state.messages);
        },
        failOptimistic(state, action: PayloadAction<{ clientMsgId: string; error: string }>) {
            const index = state.messages.findIndex((m) => m.clientMsgId === action.payload.clientMsgId);
            if (index !== -1) {
                state.messages[index].pending = false;
                state.messages[index].failed = true;
                state.messages[index].error = action.payload.error;
            }
        },
        removeMessage(state, action: PayloadAction<{ clientMsgId: string }>) {
            state.messages = state.messages.filter((m) => m.clientMsgId !== action.payload.clientMsgId);
        },
        /** Поддержка прочитала наши сообщения до lastMessageId (support:read) */
        applyReadReceipt(state, action: PayloadAction<{ lastMessageId?: number | null; readAt?: string }>) {
            const readAt = action.payload.readAt || new Date().toISOString();
            const last = action.payload.lastMessageId ?? null;
            for (const m of state.messages) {
                if (m.senderRole !== 'user' || m.readAt || m.id < 0) continue;
                if (last === null || m.id <= last) m.readAt = readAt;
            }
        },
        setUnread(state, action: PayloadAction<number>) {
            state.unreadCount = Math.max(0, Number(action.payload) || 0);
            if (state.chat) state.chat.userUnread = state.unreadCount;
        },
        incrementUnread(state) {
            state.unreadCount += 1;
            if (state.chat) state.chat.userUnread = state.unreadCount;
        },
        setTyping(state, action: PayloadAction<boolean>) {
            state.typing = action.payload;
        },
        setHours(state, action: PayloadAction<SupportHours | null>) {
            state.hours = action.payload;
        },
        reset() {
            return initialState;
        },
    },
});

export const {
    setStatus,
    setError,
    setChat,
    setChatInfo,
    prependMessages,
    appendMessage,
    addOptimistic,
    confirmOptimistic,
    failOptimistic,
    removeMessage,
    applyReadReceipt,
    setUnread,
    incrementUnread,
    setTyping,
    setHours,
    reset,
} = supportChatSlice.actions;

export default supportChatSlice.reducer;
