import React from 'react';
import Modal from 'react-modal';
import Icon from '@/components/icons/Icon';
import styles from './membersModal.module.css';

export type ChatMember = {
  id: string;
  name: string;
  avatarInitial: string;
  avatarColor: string;
  isCurrentUser?: boolean;
};

interface MembersModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  memberCount: number;
  members: ChatMember[];
  onCall?: (memberId: string) => void;
  onDelete?: (memberId: string) => void;
}

const MembersModal = ({
  isOpen,
  onClose,
  title,
  memberCount,
  members,
  onCall,
  onDelete,
}: MembersModalProps) => {
  const handleCall = (memberId: string) => {
    if (onCall) {
      onCall(memberId);
    }
  };

  const handleDelete = (memberId: string) => {
    if (onDelete) {
      onDelete(memberId);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onRequestClose={onClose}
      overlayClassName={styles.modalOverlay}
      className={styles.membersModal}
      closeTimeoutMS={300}
      shouldCloseOnOverlayClick={true}
    >
      <div className={styles.modalContent}>
        {/* Header */}
        <div className={styles.modalHeader}>
          <div className={styles.modalHeaderLeft}>
            <h3 className={styles.modalTitle}>{title}</h3>
            <p className={styles.modalMemberCount}>{memberCount} участника</p>
          </div>
          <button className={styles.closeButton} onClick={onClose} aria-label="Close">
            <Icon name="closeLine" size={24} />
          </button>
        </div>

        {/* Members List */}
        <div className={styles.membersList}>
          {members.map((member) => (
            <div key={member.id} className={styles.memberItem}>
              <div
                className={styles.memberAvatar}
                style={{ backgroundColor: member.avatarColor }}
              >
                <span className={styles.avatarInitial}>{member.avatarInitial}</span>
              </div>
              <span className={styles.memberName}>{member.name}</span>
              <div className={styles.memberActions}>
                {!member.isCurrentUser && (
                  <button
                    className={styles.callButton}
                    onClick={() => handleCall(member.id)}
                    aria-label="Call"
                  >
                    <Icon name="phone" size={20} color="#ffffff" />
                  </button>
                )}
                <button
                  className={styles.deleteButton}
                  onClick={() => handleDelete(member.id)}
                  aria-label="Delete"
                >
                  <Icon name="trash" size={20} color="#cf3030" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </Modal>
  );
};

export default MembersModal;

