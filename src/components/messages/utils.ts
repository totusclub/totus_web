import { Message } from "@/store/slices/chat/types";



export const formatDateDivider = (dateString: string) => {
  if (!dateString) return '';

  const messageDate = new Date(dateString);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  if (messageDate.toDateString() === today.toDateString()) {
    return 'Сегодня';
  } else if (messageDate.toDateString() === yesterday.toDateString()) {
    return 'Вчера';
  } else {
    return messageDate.toLocaleDateString('ru-RU', { weekday: 'long', day: 'numeric', month: 'long' });
  }
};


export const groupMessagesByDate = (messages: Message[] | undefined) => {
  if (!messages || messages.length === 0) return [];

  // Reverse messages for display (oldest first)
  const reversedMessages = [...messages].reverse();

  const grouped: Array<{ date: string; messages: Message[] }> = [];
  let currentDate = '';
  let currentGroup: Message[] = [];

  reversedMessages.forEach((message) => {
    const messageDate = message.createdAt || message.time;
    const dateKey = messageDate ? new Date(messageDate).toDateString() : '';

    if (dateKey !== currentDate) {
      if (currentGroup.length > 0) {
        grouped.push({ date: currentDate, messages: currentGroup });
      }
      currentDate = dateKey;
      currentGroup = [message];
    } else {
      currentGroup.push(message);
    }
  });

  if (currentGroup.length > 0) {
    grouped.push({ date: currentDate, messages: currentGroup });
  }

  return grouped;
};