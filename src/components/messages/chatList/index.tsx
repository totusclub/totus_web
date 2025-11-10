import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '@/store';
import { fetchChatRooms, setSelectedChat } from '@/store/slices/chat/chatSlice';
import styles from './chatList.module.css';
import Icon from "@/components/icons/Icon";
import NewGroupModal from '../newGroupModal';

interface ChatListProps {
    selectedChat: string | null;
    onChatSelect: (chatId: string) => void;
}

const ChatList = ({ selectedChat, onChatSelect }: ChatListProps) => {
    const dispatch = useDispatch<AppDispatch>();
    const [isNewGroupModalOpen, setIsNewGroupModalOpen] = useState(false);
    const { chatRooms, chatRoomsLoading, chatRoomsError } = useSelector(
        (state: RootState) => state.chat
    );

    useEffect(() => {
        // Fetch chat rooms on component mount
        dispatch(fetchChatRooms());
    }, [dispatch]);

    const handleAddChat = () => {
        setIsNewGroupModalOpen(true);
    };

    const handleCreateGroup = (groupType: string, loyaltyCards: string[]) => {
        console.log('Create group:', { groupType, loyaltyCards });
        // TODO: Implement API call to create new group
        // After successful creation, refresh chat rooms list
        dispatch(fetchChatRooms());
    };

    const handleChatSelect = (chatId: string) => {
        dispatch(setSelectedChat(chatId));
        onChatSelect(chatId);
    };

    return (
        <div className={styles.chatList}>
            <div className={styles.chatListHeader}>
                <h2 className={styles.chatListTitle}>Чаты</h2>
                <button onClick={handleAddChat} className={styles.addButton}>
                    <Icon name={'plus'} size={20} />
                </button>
            </div>
            <div className={styles.chatListItems}>
                {chatRoomsLoading ? (
                    <div className={styles.loadingState}>Загрузка...</div>
                ) : chatRoomsError ? (
                    <div className={styles.errorState}>Ошибка: {chatRoomsError}</div>
                ) : (
                    chatRooms.map((chat) => (
                        <div
                            key={chat.id}
                            onClick={() => handleChatSelect(chat.id)}
                            className={`${styles.chatItem} ${selectedChat === chat.id ? styles.chatItemActive : ''}`}
                        >
                            <div className={styles.chatItemIcon} style={{ backgroundColor: chat.iconColor }}>
                                <Icon name={chat.icon as any} size={20} />
                            </div>
                            <div className={styles.chatItemContent}>
                                <p className={styles.chatItemTitle}>{chat.title}</p>
                                <p className={styles.chatItemMessage}>{chat.lastMessage}</p>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* New Group Modal */}
            <NewGroupModal
                isOpen={isNewGroupModalOpen}
                onClose={() => setIsNewGroupModalOpen(false)}
                onCreate={handleCreateGroup}
            />
        </div>
    );
};

export default ChatList;

