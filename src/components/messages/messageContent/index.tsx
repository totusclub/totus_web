import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '@/store';
import { fetchRoomMessages, sendMessage } from '@/store/slices/chat/chatSlice';
import styles from './messageContent.module.css';
import Icon from "@/components/icons/Icon";
import DefaultMessage from './defaultMessage';
import MessageList from '../messageList';
import MembersModal, { ChatMember } from '../membersModal';



const MessageContent = ({ selectedChat }: { selectedChat: string | null }) => {
  const dispatch = useDispatch<AppDispatch>();
  const [messageText, setMessageText] = useState('');
  const [isMembersModalOpen, setIsMembersModalOpen] = useState(false);
  const messagesAreaRef = useRef<HTMLDivElement>(null);
  const isLoadingMoreRef = useRef(false);
  const { chatRooms, messagesByRoom } = useSelector(
    (state: RootState) => state.chat
  );
  // Get selected chat room data
  const selectedChatRoom = chatRooms.find(room => room.id === selectedChat);
  // Get messages for selected chat
  const chatMessages = selectedChat ? messagesByRoom[selectedChat] : null;
  // Fetch messages when chat is selected
  useEffect(() => {
    if (selectedChat && !messagesByRoom[selectedChat]) {
      // Initial load - fetch first 20 messages
      dispatch(fetchRoomMessages({ roomId: selectedChat, offset: 0, limit: 20 }));
    }
  }, [selectedChat, messagesByRoom, dispatch]);
  // Handle scroll to load more messages (pagination)
  const handleScroll = useCallback(() => {
    if (!messagesAreaRef.current || !selectedChat || !chatMessages) return;
    const { scrollTop } = messagesAreaRef.current;
    // Load more when scrolled to top (within 100px)
    if (scrollTop < 100 && chatMessages.hasMore && !chatMessages.isLoading && !isLoadingMoreRef.current) {
      isLoadingMoreRef.current = true;
      dispatch(fetchRoomMessages({
        roomId: selectedChat,
        offset: chatMessages.offset,
        limit: 20,
      })).finally(() => {
        isLoadingMoreRef.current = false;
      });
    }
  }, [selectedChat, chatMessages, dispatch]);
  // Attach scroll listener
  useEffect(() => {
    const messagesArea = messagesAreaRef.current;
    if (messagesArea) {
      messagesArea.addEventListener('scroll', handleScroll);
      return () => messagesArea.removeEventListener('scroll', handleScroll);
    }
  }, [handleScroll]);
  // Scroll to bottom when new messages arrive (only if already at bottom)
  useEffect(() => {
    if (messagesAreaRef.current && selectedChat && messagesByRoom[selectedChat]) {
      const { scrollTop, scrollHeight, clientHeight } = messagesAreaRef.current;
      const isNearBottom = scrollHeight - scrollTop - clientHeight < 100;
      if (isNearBottom) {
        messagesAreaRef.current.scrollTop = messagesAreaRef.current.scrollHeight;
      }
    }
  }, [selectedChat, messagesByRoom]);
  const handleSendMessage = () => {
    if (messageText.trim() && selectedChat) {
      dispatch(sendMessage({ roomId: selectedChat, text: messageText.trim() }));
      setMessageText('');
      // Scroll to bottom after sending
      setTimeout(() => {
        if (messagesAreaRef.current) {
          messagesAreaRef.current.scrollTop = messagesAreaRef.current.scrollHeight;
        }
      }, 100);
    }
  };
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Mock members data - TODO: Replace with actual API call
  const getMembers = (): ChatMember[] => {
    if (!selectedChatRoom) return [];

    // Mock members based on chat room
    const mockMembers: ChatMember[] = [
      {
        id: '1',
        name: 'Вы',
        avatarInitial: selectedChatRoom.title[0]?.toUpperCase() || 'В',
        avatarColor: selectedChatRoom.iconColor,
        isCurrentUser: true,
      },
      {
        id: '2',
        name: 'Сергей Сидоров',
        avatarInitial: 'С',
        avatarColor: '#FFD700',
      },
      {
        id: '3',
        name: 'София Смирнова',
        avatarInitial: 'С',
        avatarColor: '#FFD700',
      },
      {
        id: '4',
        name: 'Светлана Кузнецова',
        avatarInitial: 'С',
        avatarColor: '#FFD700',
      },
    ];

    return mockMembers;
  };

  const handleCallMember = (memberId: string) => {
    console.log('Call member:', memberId);
    // TODO: Implement call functionality
  };

  const handleDeleteMember = (memberId: string) => {
    console.log('Delete member:', memberId);
    // TODO: Implement delete member functionality
  };

  if (!selectedChat || !selectedChatRoom) {
    return (
      <DefaultMessage />
    );
  }
  const messages = chatMessages?.messages || [];
  return (
    <div className={styles.messageContent}>
      {/* Chat Header */}
      <div className={styles.chatHeader}>
        <div className={styles.chatHeaderLeft}>
          <div className={styles.chatAvatar} style={{ backgroundColor: selectedChatRoom.iconColor }}>
            <span className={styles.chatAvatarInitial}>
              {selectedChatRoom.title[0]?.toUpperCase() || ''}
            </span>
          </div>
          <div className={styles.chatHeaderInfo}>
            <h3 className={styles.chatTitle}>{selectedChatRoom.title}</h3>
            <p
              className={styles.chatMemberCount}
              onClick={() => setIsMembersModalOpen(true)}
            >
              {selectedChatRoom.memberCount} участника
            </p>
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
      <div className={styles.messagesArea} ref={messagesAreaRef}>
        {chatMessages?.isLoading && messages.length === 0 ? (
          <div className={styles.loadingState}>Загрузка сообщений...</div>
        ) : chatMessages?.error ? (
          <div className={styles.errorState}>Ошибка: {chatMessages.error}</div>
        ) : (
          <>
            {chatMessages?.hasMore && (
              <div className={styles.loadMoreIndicator}>
                {chatMessages.isLoading ? 'Загрузка...' : 'Прокрутите вверх для загрузки старых сообщений'}
              </div>
            )}
            <MessageList messages={messages} />
            {/* Typing indicator - can be added later when socket is connected */}
          </>
        )}
      </div>
      {/* Input Area */}
      <div className={styles.inputArea}>
        <button className={styles.inputButton}>
          <Icon name={'upload'} size={30} />
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
        <button onClick={handleSendMessage} className={styles.sendButton} disabled={!messageText.trim()}>
          <Icon name={'messageArrow'} size={20} color={'#fff'} />
        </button>
      </div>

      {/* Members Modal */}
      <MembersModal
        isOpen={isMembersModalOpen}
        onClose={() => setIsMembersModalOpen(false)}
        title={selectedChatRoom.title}
        memberCount={selectedChatRoom.memberCount}
        members={getMembers()}
        onCall={handleCallMember}
        onDelete={handleDeleteMember}
      />
    </div>
  );
};
export default MessageContent;