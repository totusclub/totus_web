import React from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '@/store';
import styles from './messages.module.css';
import ChatList from '@/components/messages/chatList';
import MessageContent from '@/components/messages/messageContent';
import withAuth from "@/utils/withAuth";

const MessagesComponent = () => {
  const selectedChat = useSelector((state: RootState) => state.chat.selectedChatId);

  const handleChatSelect = () => {
    // Chat selection is handled in ChatList component via Redux
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

