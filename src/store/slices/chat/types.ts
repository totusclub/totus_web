export type Message = {
  id: string;
  sender: string;
  text: string;
  time: string;
  isOwn: boolean;
  avatarInitial?: string;
  avatarColor?: string;
  isOnline?: boolean;
  createdAt?: string; // ISO date string for sorting
};

export type ChatRoom = {
  id: string;
  icon: string;
  iconColor: string;
  title: string;
  lastMessage: string;
  lastMessageTime?: string;
  memberCount: number;
  unreadCount?: number;
};

export type ChatMessages = {
  roomId: string;
  messages: Message[];
  offset: number;
  hasMore: boolean;
  isLoading: boolean;
  error: string | null;
};

export type ChatState = {
  chatRooms: ChatRoom[];
  chatRoomsLoading: boolean;
  chatRoomsError: string | null;
  selectedChatId: string | null;
  messagesByRoom: Record<string, ChatMessages>;
  pendingMessages: Record<string, Message[]>; // Optimistic updates
};

