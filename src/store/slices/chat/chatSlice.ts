import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { ChatState, Message } from './types';
import { mockChatRooms, getMessagesWithPagination } from './mockData';

const initialState: ChatState = {
  chatRooms: [],
  chatRoomsLoading: false,
  chatRoomsError: null,
  selectedChatId: null,
  messagesByRoom: {},
  pendingMessages: {},
};

// Async thunk to fetch chat rooms
export const fetchChatRooms = createAsyncThunk(
  'chat/fetchChatRooms',
  async (_, { rejectWithValue }) => {
    try {
      // TODO: Replace with actual API call
      // const response = await api.getChatRooms();
      // return response.data;
      
      // Mock API delay
      await new Promise(resolve => setTimeout(resolve, 500));
      return mockChatRooms;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch chat rooms');
    }
  }
);

// Async thunk to fetch messages for a specific room with pagination
export const fetchRoomMessages = createAsyncThunk(
  'chat/fetchRoomMessages',
  async (
    { roomId, offset = 0, limit = 20 }: { roomId: string; offset?: number; limit?: number },
    { rejectWithValue, getState }
  ) => {
    try {
      // TODO: Replace with actual API call
      // const response = await api.getRoomMessages(roomId, { offset, limit });
      // return { roomId, messages: response.data.messages, hasMore: response.data.hasMore };
      
      // Mock API delay
      await new Promise(resolve => setTimeout(resolve, 300));
      
      const messages = getMessagesWithPagination(roomId, offset, limit);
      const allMessages = getMessagesWithPagination(roomId, 0, 1000); // Get all to check if hasMore
      const hasMore = offset + limit < allMessages.length;
      
      return {
        roomId,
        messages,
        hasMore,
        offset,
      };
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch messages');
    }
  }
);

// Async thunk to send a message (optimistic update)
export const sendMessage = createAsyncThunk(
  'chat/sendMessage',
  async (
    { roomId, text }: { roomId: string; text: string },
    { rejectWithValue, dispatch }
  ) => {
    try {
      // Create optimistic message
      const tempMessageId = `temp-${Date.now()}`;
      const optimisticMessage: Message = {
        id: tempMessageId,
        sender: 'Ты',
        text,
        time: 'Только что',
        isOwn: true,
        createdAt: new Date().toISOString(),
      };

      // Add optimistic message immediately
      dispatch(addOptimisticMessage({ roomId, message: optimisticMessage }));

      // TODO: Replace with actual API call
      // const response = await api.sendMessage(roomId, { text });
      // return { roomId, message: response.data.message };
      
      // Mock API delay
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Replace temp message with real one from API
      const realMessage: Message = {
        ...optimisticMessage,
        id: `msg-${Date.now()}`,
      };

      dispatch(confirmSentMessage({ roomId, tempId: tempMessageId, realMessage }));

      return { roomId, message: realMessage };
    } catch (error: any) {
      // Remove optimistic message on error
      dispatch(removeOptimisticMessage({ roomId, tempId: tempMessageId }));
      return rejectWithValue(error.message || 'Failed to send message');
    }
  }
);

const chatSlice = createSlice({
  name: 'chat',
  initialState,
  reducers: {
    setSelectedChat(state, action: PayloadAction<string | null>) {
      state.selectedChatId = action.payload;
    },
    
    addOptimisticMessage(state, action: PayloadAction<{ roomId: string; message: Message }>) {
      const { roomId, message } = action.payload;
      
      if (!state.messagesByRoom[roomId]) {
        state.messagesByRoom[roomId] = {
          roomId,
          messages: [],
          offset: 0,
          hasMore: false,
          isLoading: false,
          error: null,
        };
      }
      
      // Add to pending messages
      if (!state.pendingMessages[roomId]) {
        state.pendingMessages[roomId] = [];
      }
      state.pendingMessages[roomId].push(message);
      
      // Add to messages list
      state.messagesByRoom[roomId].messages.unshift(message);
    },
    
    confirmSentMessage(
      state,
      action: PayloadAction<{ roomId: string; tempId: string; realMessage: Message }>
    ) {
      const { roomId, tempId, realMessage } = action.payload;
      
      if (state.messagesByRoom[roomId]) {
        // Replace temp message with real one
        const index = state.messagesByRoom[roomId].messages.findIndex(m => m.id === tempId);
        if (index !== -1) {
          state.messagesByRoom[roomId].messages[index] = realMessage;
        }
      }
      
      // Remove from pending
      if (state.pendingMessages[roomId]) {
        state.pendingMessages[roomId] = state.pendingMessages[roomId].filter(m => m.id !== tempId);
      }
    },
    
    removeOptimisticMessage(
      state,
      action: PayloadAction<{ roomId: string; tempId: string }>
    ) {
      const { roomId, tempId } = action.payload;
      
      if (state.messagesByRoom[roomId]) {
        state.messagesByRoom[roomId].messages = state.messagesByRoom[roomId].messages.filter(
          m => m.id !== tempId
        );
      }
      
      if (state.pendingMessages[roomId]) {
        state.pendingMessages[roomId] = state.pendingMessages[roomId].filter(m => m.id !== tempId);
      }
    },
    
    clearChatState(state) {
      state.selectedChatId = null;
      state.messagesByRoom = {};
      state.pendingMessages = {};
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch chat rooms
      .addCase(fetchChatRooms.pending, (state) => {
        state.chatRoomsLoading = true;
        state.chatRoomsError = null;
      })
      .addCase(fetchChatRooms.fulfilled, (state, action) => {
        state.chatRoomsLoading = false;
        state.chatRooms = action.payload;
      })
      .addCase(fetchChatRooms.rejected, (state, action) => {
        state.chatRoomsLoading = false;
        state.chatRoomsError = action.payload as string;
      })
      
      // Fetch room messages
      .addCase(fetchRoomMessages.pending, (state, action) => {
        const roomId = action.meta.arg.roomId;
        if (!state.messagesByRoom[roomId]) {
          state.messagesByRoom[roomId] = {
            roomId,
            messages: [],
            offset: 0,
            hasMore: false,
            isLoading: true,
            error: null,
          };
        } else {
          state.messagesByRoom[roomId].isLoading = true;
          state.messagesByRoom[roomId].error = null;
        }
      })
      .addCase(fetchRoomMessages.fulfilled, (state, action) => {
        const { roomId, messages, hasMore, offset } = action.payload;
        
        if (!state.messagesByRoom[roomId]) {
          state.messagesByRoom[roomId] = {
            roomId,
            messages: [],
            offset: 0,
            hasMore: false,
            isLoading: false,
            error: null,
          };
        }
        
        // If offset is 0, replace messages (initial load)
        // Otherwise, prepend messages (load more older messages)
        if (offset === 0) {
          state.messagesByRoom[roomId].messages = messages;
        } else {
          // Prepend older messages (they come in reverse chronological order)
          state.messagesByRoom[roomId].messages = [
            ...messages,
            ...state.messagesByRoom[roomId].messages,
          ];
        }
        
        state.messagesByRoom[roomId].offset = offset + messages.length;
        state.messagesByRoom[roomId].hasMore = hasMore;
        state.messagesByRoom[roomId].isLoading = false;
      })
      .addCase(fetchRoomMessages.rejected, (state, action) => {
        const roomId = action.meta.arg.roomId;
        if (state.messagesByRoom[roomId]) {
          state.messagesByRoom[roomId].isLoading = false;
          state.messagesByRoom[roomId].error = action.payload as string;
        }
      })
      
      // Send message
      .addCase(sendMessage.fulfilled, (state, action) => {
        const { roomId } = action.payload;
        // Update last message in chat room
        const room = state.chatRooms.find(r => r.id === roomId);
        if (room) {
          room.lastMessage = action.payload.message.text;
          room.lastMessageTime = action.payload.message.createdAt;
        }
      });
  },
});

export const {
  setSelectedChat,
  addOptimisticMessage,
  confirmSentMessage,
  removeOptimisticMessage,
  clearChatState,
} = chatSlice.actions;

export default chatSlice.reducer;

