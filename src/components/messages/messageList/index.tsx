import React from 'react';
import { Message } from '@/store/slices/chat/types';
import { formatDateDivider, groupMessagesByDate } from '../utils';
import MessageItem from '../messageItem';
import styles from './messageList.module.css';

interface MessageListProps {
  messages: Message[];
}

const MessageList = ({ messages }: MessageListProps) => {
  const groupedMessages = groupMessagesByDate(messages);

  return (
    <>
      {groupedMessages.map((group) => (
        <React.Fragment key={group.date}>
          <div className={styles.messageDateDivider}>
            <span>{formatDateDivider(group.date)}</span>
          </div>
          {group.messages.map((message) => (
            <MessageItem key={message.id} message={message} />
          ))}
        </React.Fragment>
      ))}
    </>
  );
};

export default MessageList;

