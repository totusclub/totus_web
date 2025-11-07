import styles from './messengerSection.module.css';
import Icon from "@/components/icons/Icon";
import { useRouter } from "next/router";

const MessengerSection = () => {
  const router = useRouter();

  const handleMessagesClick = () => {
    router.push('/messages');
  };

  return (
    <div className={styles.messengerSection}>
      <div className={styles.messengerSectionHead}>
        <p>Групповой мессенджер</p>
      </div>
      <div onClick={handleMessagesClick} className={styles.messengerSectionItem}>
        <div className={styles.messengerSectionLeft}>
          <div className={styles.messengerIconWrapper}>
            <div className={styles.indicatorMessage} />
            <Icon name={'message'} size={24} color={'black'} />
          </div>
          <p>Мои сообщения</p>
        </div>
        <Icon name={'next'} size={18} color={'black'} />
      </div>
    </div>
  );
};

export default MessengerSection;

