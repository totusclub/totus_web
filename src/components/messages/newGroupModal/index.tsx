import React, { useState, useRef } from 'react';
import Modal from 'react-modal';
import Icon from '@/components/icons/Icon';
import Select from '@/components/UI/select';
import styles from './newGroupModal.module.css';

export type GroupType = {
  name: string;
  value: string;
  icon: string;
};

export type FoundUser = {
  id: string;
  name: string;
  avatarInitial: string;
  avatarColor: string;
  loyaltyCard: string;
};

export type AddedMember = {
  id: string;
  name: string;
  avatarInitial: string;
  avatarColor: string;
  loyaltyCard: string;
};

interface NewGroupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (groupType: string, loyaltyCards: string[]) => void;
}

// Mock data for demonstration
const MOCK_USERS: { [key: string]: FoundUser } = {
  '3455456277103507': {
    id: '1',
    name: 'Сергей Сидоров',
    avatarInitial: 'С',
    avatarColor: '#FFD700',
    loyaltyCard: '3455456277103507',
  },
  '4961031153016293': {
    id: '2',
    name: 'София Смирнова',
    avatarInitial: 'С',
    avatarColor: '#FF6B9D',
    loyaltyCard: '4961031153016293',
  },
  '1234567890123456': {
    id: '3',
    name: 'Светлана Кузнецова',
    avatarInitial: 'С',
    avatarColor: '#4ECDC4',
    loyaltyCard: '1234567890123456',
  },
};

// Mock search function - simulates API call
const mockSearchUserByLoyaltyCard = async (cardNumber: string): Promise<FoundUser | null> => {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 1000));

  // Return mock user if exists, otherwise null
  return MOCK_USERS[cardNumber] || null;
};

const NewGroupModal = ({ isOpen, onClose, onCreate }: NewGroupModalProps) => {
  const [selectedGroupType, setSelectedGroupType] = useState<string>('');
  const [loyaltyCards, setLoyaltyCards] = useState<string[]>(['']);
  const [cardErrors, setCardErrors] = useState<{ [key: number]: string }>({});
  const [loadingCards, setLoadingCards] = useState<{ [key: number]: boolean }>({});
  const [foundUsers, setFoundUsers] = useState<{ [key: number]: FoundUser | null }>({});
  const [addedMembers, setAddedMembers] = useState<AddedMember[]>([]);
  const searchTimeouts = useRef<{ [key: number]: NodeJS.Timeout }>({});

  const groupTypeOptions: GroupType[] = [
    {
      name: 'Семья',
      value: 'family',
      icon: 'folder',
    },
    {
      name: 'Друзья',
      value: 'friends',
      icon: 'folder',
    },
  ];

  // Format loyalty card number: 4961 0311 5301 6293
  const formatLoyaltyCard = (value: string): string => {
    // Remove all non-digit characters
    const digits = value.replace(/\D/g, '');

    // Limit to 16 digits
    const limitedDigits = digits.slice(0, 16);

    // Add spaces every 4 digits
    return limitedDigits.replace(/(\d{4})(?=\d)/g, '$1 ');
  };

  // Validate loyalty card number
  const validateLoyaltyCard = (card: string): string | null => {
    const digits = card.replace(/\D/g, '');

    if (digits.length === 0) {
      return null; // Empty is allowed (not required until submit)
    }

    if (digits.length !== 16) {
      return 'Номер карты должен содержать 16 цифр';
    }

    return null;
  };

  const handleGroupTypeChange = (option: GroupType | string) => {
    const selectedOption = typeof option === 'string'
      ? groupTypeOptions.find(opt => opt.value === option || opt.name === option)
      : option;
    if (selectedOption) {
      setSelectedGroupType(selectedOption.name);
    }
  };

  const handleLoyaltyCardChange = (index: number, value: string) => {
    const formattedValue = formatLoyaltyCard(value);
    const newCards = [...loyaltyCards];
    newCards[index] = formattedValue;
    setLoyaltyCards(newCards);

    // Clear previous found user for this index
    const newFoundUsers = { ...foundUsers };
    delete newFoundUsers[index];
    setFoundUsers(newFoundUsers);

    // Clear loading state
    const newLoading = { ...loadingCards };
    delete newLoading[index];
    setLoadingCards(newLoading);

    // Clear previous timeout
    if (searchTimeouts.current[index]) {
      clearTimeout(searchTimeouts.current[index]);
    }

    // Validate and update errors
    const error = validateLoyaltyCard(formattedValue);
    const newErrors = { ...cardErrors };
    if (error) {
      newErrors[index] = error;
    } else {
      delete newErrors[index];
    }
    setCardErrors(newErrors);

    // If card is complete (16 digits), search for user
    const digits = formattedValue.replace(/\D/g, '');
    if (digits.length === 16) {
      // Set loading state
      setLoadingCards({ ...loadingCards, [index]: true });

      // Debounce search
      searchTimeouts.current[index] = setTimeout(async () => {
        const cardNumber = digits;
        const user = await mockSearchUserByLoyaltyCard(cardNumber);

        setLoadingCards((prev) => {
          const updated = { ...prev };
          delete updated[index];
          return updated;
        });

        if (user) {
          setFoundUsers((prev) => ({ ...prev, [index]: user }));
        } else {
          setFoundUsers((prev) => {
            const updated = { ...prev };
            delete updated[index];
            return updated;
          });
        }
      }, 500);
    }
  };

  const handleAddUser = (user: FoundUser, cardIndex: number) => {
    // Check if user is already added
    if (addedMembers.some(member => member.id === user.id || member.loyaltyCard === user.loyaltyCard)) {
      return;
    }

    const newMember: AddedMember = {
      id: user.id,
      name: user.name,
      avatarInitial: user.avatarInitial,
      avatarColor: user.avatarColor,
      loyaltyCard: user.loyaltyCard,
    };

    setAddedMembers([...addedMembers, newMember]);

    // Clear the card input and found user
    const newCards = [...loyaltyCards];
    newCards[cardIndex] = '';
    setLoyaltyCards(newCards);

    const newFoundUsers = { ...foundUsers };
    delete newFoundUsers[cardIndex];
    setFoundUsers(newFoundUsers);
  };

  const handleRemoveMember = (memberId: string) => {
    setAddedMembers(addedMembers.filter(member => member.id !== memberId));
  };

  const handleAddAnotherCard = () => {
    setLoyaltyCards([...loyaltyCards, '']);
  };

  const handleCreate = () => {
    // Get loyalty cards from added members
    const memberCards = addedMembers.map(member => member.loyaltyCard);

    // Also check if there are any valid cards in inputs
    const validInputCards = loyaltyCards
      .map(card => {
        const digits = card.replace(/\D/g, '');
        return digits.length === 16 ? digits : null;
      })
      .filter((card): card is string => card !== null);

    const allCards = [...memberCards, ...validInputCards];

    if (selectedGroupType && allCards.length > 0) {
      onCreate(selectedGroupType, allCards);
      // Reset form
      setSelectedGroupType('');
      setLoyaltyCards(['']);
      setCardErrors({});
      setFoundUsers({});
      setLoadingCards({});
      setAddedMembers([]);
      // Clear all timeouts
      Object.values(searchTimeouts.current).forEach(timeout => clearTimeout(timeout));
      searchTimeouts.current = {};
      onClose();
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onRequestClose={onClose}
      overlayClassName={styles.modalOverlay}
      className={styles.newGroupModal}
      closeTimeoutMS={300}
      shouldCloseOnOverlayClick={true}
    >
      <div className={styles.modalContent}>
        {/* Header */}
        <div className={styles.modalHeader}>
          <h3 className={styles.modalTitle}>Новая группа</h3>
          <button className={styles.closeButton} onClick={onClose} aria-label="Close">
            <Icon name="closeLine" size={24} />
          </button>
        </div>

        {/* Form */}
        <div className={styles.modalBody}>
          {/* Group Type Select */}
          <div className={styles.formField}>
            <Select
              options={groupTypeOptions}
              value={selectedGroupType}
              onChange={handleGroupTypeChange}
              placeholder="Тип группы"
              isFull={true}
            />
          </div>

          {/* Added Members List */}
          {addedMembers.length > 0 && (
            <div className={styles.addedMembersSection}>
              {addedMembers.map((member) => (
                <div key={member.id} className={styles.addedMemberItem}>
                  <div
                    className={styles.memberAvatar}
                    style={{ backgroundColor: member.avatarColor }}
                  >
                    <span className={styles.avatarInitial}>{member.avatarInitial}</span>
                  </div>
                  <span className={styles.memberName}>{member.name}</span>
                  <button
                    className={styles.removeMemberButton}
                    onClick={() => handleRemoveMember(member.id)}
                    aria-label="Remove member"
                  >
                    <Icon name="trash" size={20} color="#cf3030" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Loyalty Cards */}
          <div className={styles.loyaltyCardsSection}>
            {loyaltyCards.map((card, index) => {
              const digits = card.replace(/\D/g, '');
              const isValid = digits.length === 16;
              const isLoading = loadingCards[index];
              const foundUser = foundUsers[index];
              const showCheckmark = isValid && !isLoading && foundUser;

              return (
                <div key={index} className={styles.formField}>
                  <div className={styles.inputWrapper}>
                    <input
                      type="text"
                      className={`${styles.loyaltyCardInput} ${cardErrors[index] ? styles.loyaltyCardInputError : ''} ${showCheckmark ? styles.loyaltyCardInputSuccess : ''}`}
                      placeholder="4961 0311 5301 6293"
                      value={card}
                      onChange={(e) => handleLoyaltyCardChange(index, e.target.value)}
                      maxLength={19} // 16 digits + 3 spaces
                    />
                    {isLoading && (
                      <div className={`${styles.inputIcon} ${styles.inputIconLoader}`}>
                        <Icon name="loader" size={20} color="var(--textTertiary)" />
                      </div>
                    )}
                    {showCheckmark && (
                      <div className={`${styles.inputIcon} ${styles.inputIconCheck}`}>
                        <Icon name="checkLine" size={20} color="#39bf87" />
                      </div>
                    )}
                  </div>
                  {cardErrors[index] && (
                    <span className={styles.errorMessage}>{cardErrors[index]}</span>
                  )}
                  {foundUser && (
                    <div
                      className={styles.foundUserItem}
                      onClick={() => handleAddUser(foundUser, index)}
                    >
                      <div
                        className={styles.memberAvatar}
                        style={{ backgroundColor: foundUser.avatarColor }}
                      >
                        <span className={styles.avatarInitial}>{foundUser.avatarInitial}</span>
                      </div>
                      <span className={styles.memberName}>{foundUser.name}</span>
                      <button
                        className={styles.removeFoundUserButton}
                        onClick={(e) => {
                          e.stopPropagation();
                          const newFoundUsers = { ...foundUsers };
                          delete newFoundUsers[index];
                          setFoundUsers(newFoundUsers);
                        }}
                        aria-label="Remove"
                      >
                        <Icon name="trash" size={20} color="#cf3030" />
                      </button>
                    </div>
                  )}
                </div>
              );
            })}

            {/* Add Another Card Link */}
            <button
              className={styles.addCardLink}
              onClick={handleAddAnotherCard}
              type="button"
            >
              Добавить ещё карту
            </button>
          </div>
        </div>

        {/* Create Button */}
        <div className={styles.modalFooter}>
          <button
            className={styles.createButton}
            onClick={handleCreate}
            disabled={
              !selectedGroupType ||
              (addedMembers.length === 0 && loyaltyCards.every(card => {
                const digits = card.replace(/\D/g, '');
                return digits.length === 0;
              })) ||
              Object.keys(cardErrors).length > 0
            }
          >
            Создать
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default NewGroupModal;

