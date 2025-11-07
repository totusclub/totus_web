import React from 'react';
import styles from './chatList.module.css';
import Icon from "@/components/icons/Icon";

type ChatRoom = {
    id: string;
    icon: string;
    iconColor: string;
    title: string;
    lastMessage: string;
};

interface ChatListProps {
    selectedChat: string | null;
    onChatSelect: (chatId: string) => void;
}

const ChatList = ({ selectedChat, onChatSelect }: ChatListProps) => {

    // Mock data - replace with actual data from API
    const chatRooms: ChatRoom[] = [
        {
            id: '1',
            icon: 'folder',
            iconColor: '#FE732E',
            title: 'Семья',
            lastMessage: 'Пол - Приходи ко мне, я готовлю еду на двоих'
        },
        {
            id: '2',
            icon: 'folder',
            iconColor: '#FE732E',
            title: 'Друзья',
            lastMessage: 'Оскар - Приходи ко мне, я готовлю еду на двоих'
        },
        {
            id: '3',
            icon: 'supportInfo',
            iconColor: '#0D77D3',
            title: 'Поддержка',
            lastMessage: 'Ваши документы готовы'
        }
    ];

    const handleAddChat = () => {
        // Handle add new chat
        console.log('Add new chat');
    };

    const handleChatSelect = (chatId: string) => {
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
                {chatRooms.map((chat) => (
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
                ))}
            </div>
        </div>
    );
};

export default ChatList;

