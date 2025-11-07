import React, { useState } from 'react';
import styles from './messageContent.module.css';
import Icon from "@/components/icons/Icon";

type Message = {
  id: string;
  sender: string;
  text: string;
  time: string;
  isOwn: boolean;
  avatarInitial?: string;
  avatarColor?: string;
  isOnline?: boolean;
};

type ChatData = {
  id: string;
  title: string;
  icon: string;
  iconColor: string;
  memberCount: number;
  messages: Message[];
};

const MessageContent = ({ selectedChat }: { selectedChat: string | null }) => {
  const [messageText, setMessageText] = useState('');

  // Mock chat data - replace with actual API call
  const getChatData = (chatId: string | null): ChatData | null => {
    if (!chatId) return null;

    const chats: { [key: string]: ChatData } = {
      '1': {
        id: '1',
        title: 'Семья',
        icon: 'user',
        iconColor: '#FE732E',
        memberCount: 4,
        messages: [
          { id: '1', sender: 'Анна Иванова', text: 'Здесь должен быть текст', time: 'Понедельник, 16:23', isOwn: false, avatarInitial: 'А', avatarColor: '#FFD700', isOnline: true },
          { id: '2', sender: 'Екатерина Смирнова', text: 'Привет! Вот отчет за этот год, пожалуйста, посмотри и дай знать, что ты думаешь. Я жду твоего подтверждения для загрузки.', time: 'Понедельник, 16:23', isOwn: false, avatarInitial: 'Е', avatarColor: '#FFD700', isOnline: true },
          { id: '3', sender: 'Ты', text: 'Спасибо, Ава! Все выглядит отлично.', time: '9:36', isOwn: true },
          { id: '4', sender: 'Ольга Федорова', text: 'Комментарий', time: '13:12', isOwn: false, avatarInitial: 'О', avatarColor: '#FFD700', isOnline: false },
          { id: '5', sender: 'Мария Васильева', text: 'Встреча в 15:00', time: 'Только что', isOwn: false, avatarInitial: 'М', avatarColor: '#FFD700', isOnline: true },
          { id: '6', sender: 'Ты', text: 'Давайте встретимся завтра', time: 'Только что', isOwn: true },
        ]
      },
      '2': {
        id: '2',
        title: 'Друзья',
        icon: 'user',
        iconColor: '#FE732E',
        memberCount: 3,
        messages: []
      },
      '3': {
        id: '3',
        title: 'Поддержка',
        icon: 'help',
        iconColor: '#0D77D3',
        memberCount: 2,
        messages: []
      }
    };

    return chats[chatId] || null;
  };

  const chatData = getChatData(selectedChat);

  const handleSendMessage = () => {
    if (messageText.trim()) {
      // Handle send message
      console.log('Sending message:', messageText);
      setMessageText('');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  if (!selectedChat || !chatData) {
    return (
      <div className={styles.messageContent}>
        <div className={styles.messageContentHeader}>
          <h2 className={styles.messageContentTitle}>Мессенджер</h2>
          <p className={styles.messageContentText}>
            {'Ваши личные сообщения защищены сквозным шифрованием.'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.messageContent}>
      {/* Chat Header */}
      <div className={styles.chatHeader}>
        <div className={styles.chatHeaderLeft}>
          <div className={styles.chatAvatar} style={{ backgroundColor: chatData.iconColor }}>
            <Icon name={chatData.icon} size={24} color={'#fff'} />
          </div>
          <div className={styles.chatHeaderInfo}>
            <h3 className={styles.chatTitle}>{chatData.title}</h3>
            <p className={styles.chatMemberCount}>{chatData.memberCount} участника</p>
          </div>
        </div>
        <button className={styles.chatMenuButton}>
          <div className={styles.menuDots}>
            <span></span>
            <span></span>
            <span></span>
          </div>
        </button>
      </div>

      {/* Messages Area */}
      <div className={styles.messagesArea}>
        <div className={styles.messageDateDivider}>
          <span>Понедельник</span>
        </div>
        {chatData.messages.map((message) => (
          <div
            key={message.id}
            className={`${styles.messageItem} ${message.isOwn ? styles.messageOwn : styles.messageOther}`}
          >
            {!message.isOwn ? (
              <>
                <div className={styles.messageAvatarWrapper}>
                  <div
                    className={styles.messageAvatar}
                    style={{ backgroundColor: message.avatarColor || '#FFD700' }}
                  >
                    <span className={styles.avatarInitial}>{message.avatarInitial || message.sender[0]}</span>
                    {message.isOnline && <div className={styles.onlineIndicator}></div>}
                  </div>
                </div>
                <div className={styles.messageContentWrapper}>
                  <div className={styles.messageBubbleHeader}>
                    <span className={styles.messageSender}>{message.sender}</span>
                    <span className={styles.messageTimeHeader}>{message.time}</span>
                  </div>
                  <div className={styles.messageBubble}>
                    <p className={styles.messageText}>{message.text}</p>
                  </div>
                </div>
              </>
            ) : (
              <div className={styles.messageContentWrapper}>
                <div className={styles.messageBubbleHeader}>
                  <span className={styles.messageSender}>Ты</span>
                  <span className={styles.messageTimeHeader}>{message.time}</span>
                </div>
                <div className={styles.messageBubble}>
                  <p className={styles.messageText}>{message.text}</p>
                </div>
              </div>
            )}
          </div>
        ))}
        <div className={styles.messageDateDivider}>
          <span>Сегодня</span>
        </div>
        <div className={`${styles.messageItem} ${styles.messageOther} ${styles.typingIndicator}`}>
          <div className={styles.messageAvatarWrapper}>
            <div className={styles.messageAvatar} style={{ backgroundColor: '#FFD700' }}>
              <span className={styles.avatarInitial}>С</span>
              <div className={styles.onlineIndicator}></div>
            </div>
          </div>
          <div className={styles.messageBubble}>
            <div className={styles.messageBubbleHeader}>
              <span className={styles.messageSender}>Светлана Петрова</span>
              <span className={styles.messageTimeHeader}>Только что</span>
            </div>
            <div className={styles.typingDots}>
              <span></span>
              <span></span>
              <span></span>
            </div>
          </div>
        </div>
      </div>

      {/* Input Area */}
      <div className={styles.inputArea}>
        <button className={styles.inputButton}>
          <Icon name={'upload'} size={25} />
        </button>
        <input
          type="text"
          className={styles.messageInput}
          placeholder="Введите текст здесь..."
          value={messageText}
          onChange={(e) => setMessageText(e.target.value)}
          onKeyPress={handleKeyPress}
        />
        <button className={styles.inputButton}>
          <Icon name={'smile'} size={20} />
        </button>
        <button onClick={handleSendMessage} className={styles.sendButton}>
          <Icon name={'rightArrow'} size={20} color={'#fff'} />
        </button>
      </div>
    </div>
  );
};

export default MessageContent;

