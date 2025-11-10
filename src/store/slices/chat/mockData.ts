import { ChatRoom, Message } from './types';

// Mock chat rooms data
export const mockChatRooms: ChatRoom[] = [
  {
    id: '1',
    icon: 'folder',
    iconColor: '#FE732E',
    title: 'Семья',
    lastMessage: 'Пол - Приходи ко мне, я готовлю еду на двоих',
    lastMessageTime: '2024-01-15T10:30:00Z',
    memberCount: 4,
    unreadCount: 2,
  },
  {
    id: '2',
    icon: 'folder',
    iconColor: '#FE732E',
    title: 'Друзья',
    lastMessage: 'Оскар - Приходи ко мне, я готовлю еду на двоих',
    lastMessageTime: '2024-01-15T09:15:00Z',
    memberCount: 3,
    unreadCount: 0,
  },
  {
    id: '3',
    icon: 'supportInfo',
    iconColor: '#0D77D3',
    title: 'Поддержка',
    lastMessage: 'Ваши документы готовы',
    lastMessageTime: '2024-01-15T08:00:00Z',
    memberCount: 2,
    unreadCount: 1,
  },
];

// Mock messages data for each room
export const mockMessagesByRoom: Record<string, Message[]> = {
  '1': [
    {
      id: '1',
      sender: 'Анна Иванова',
      text: 'Здесь должен быть текст',
      time: 'Понедельник, 16:23',
      isOwn: false,
      avatarInitial: 'А',
      avatarColor: '#FFD700',
      isOnline: true,
      createdAt: '2024-01-15T16:23:00Z',
    },
    {
      id: '2',
      sender: 'Екатерина Смирнова',
      text: 'Привет! Вот отчет за этот год, пожалуйста, посмотри и дай знать, что ты думаешь. Я жду твоего подтверждения для загрузки.',
      time: 'Понедельник, 16:23',
      isOwn: false,
      avatarInitial: 'Е',
      avatarColor: '#FFD700',
      isOnline: true,
      createdAt: '2024-01-15T16:25:00Z',
    },
    {
      id: '3',
      sender: 'Ты',
      text: 'Спасибо, Ава! Все выглядит отлично.',
      time: '9:36',
      isOwn: true,
      createdAt: '2024-01-16T09:36:00Z',
    },
    {
      id: '4',
      sender: 'Ольга Федорова',
      text: 'Комментарий',
      time: '13:12',
      isOwn: false,
      avatarInitial: 'О',
      avatarColor: '#FFD700',
      isOnline: false,
      createdAt: '2024-01-16T13:12:00Z',
    },
    {
      id: '5',
      sender: 'Мария Васильева',
      text: 'Встреча в 15:00',
      time: 'Только что',
      isOwn: false,
      avatarInitial: 'М',
      avatarColor: '#FFD700',
      isOnline: true,
      createdAt: '2024-01-16T15:00:00Z',
    },
    {
      id: '6',
      sender: 'Ты',
      text: 'Давайте встретимся завтра',
      time: 'Только что',
      isOwn: true,
      createdAt: '2024-01-16T15:05:00Z',
    },
  ],
  '2': [],
  '3': [],
};

// Helper function to get messages with pagination
export const getMessagesWithPagination = (
  roomId: string,
  offset: number = 0,
  limit: number = 20
): Message[] => {
  const messages = mockMessagesByRoom[roomId] || [];
  // Sort by createdAt descending (newest first)
  const sortedMessages = [...messages].sort((a, b) => {
    const dateA = new Date(a.createdAt || 0).getTime();
    const dateB = new Date(b.createdAt || 0).getTime();
    return dateB - dateA;
  });
  // Return messages from offset to offset + limit
  return sortedMessages.slice(offset, offset + limit);
};

