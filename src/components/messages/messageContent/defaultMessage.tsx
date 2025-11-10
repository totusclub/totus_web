import React from 'react'
import styles from './messageContent.module.css';
export default function DefaultMessage() {
  return (
    <div className={styles.DefaultMessageContent}>
      <div className={styles.messageContentHeader}>
        <h2 className={styles.messageContentTitle}>Мессенджер</h2>
        <p className={styles.messageContentText}>
          {'Ваши личные сообщения защищены сквозным шифрованием.'}
        </p>
      </div>
    </div>
  )
}
