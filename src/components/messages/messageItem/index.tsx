import React from 'react';
import { Message } from '@/store/slices/chat/types';
import styles from './messageItem.module.css';

interface MessageItemProps {
  message: Message;
}

const MessageItem = ({ message }: MessageItemProps) => {
  return (
    <div
      className={`${styles.messageItem} ${message.isOwn ? styles.messageOwn : styles.messageOther}`}
    >
      {!message.isOwn ? (
        <>
          <div className={styles.messageAvatarWrapper}>
            <div
              className={styles.messageAvatar}
              style={{ backgroundColor: message.avatarColor || '#FFD700' }}
            >
              <span className={styles.avatarInitial}>
                {message.avatarInitial || message.sender[0]}
              </span>
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
  );
};

export default MessageItem;

