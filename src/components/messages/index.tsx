import React, { useState } from 'react';
import styles from './messages.module.css';
import ChatList from '@/components/messages/chatList';
import MessageContent from '@/components/messages/messageContent';
import withAuth from "@/utils/withAuth";

const MessagesComponent = () => {
  const [selectedChat, setSelectedChat] = useState<string | null>(null);

  const handleChatSelect = (chatId: string) => {
    setSelectedChat(chatId);
  };

  return (
    <main className={'searchContainer'}>
      <div className={'content'}>
        <div className={styles.messagesContainer}>
          <ChatList selectedChat={selectedChat} onChatSelect={handleChatSelect} />
          <MessageContent selectedChat={selectedChat} />
        </div>
      </div>
    </main>
  );
};

export default withAuth(MessagesComponent);

