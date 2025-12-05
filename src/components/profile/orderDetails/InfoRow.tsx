import React from 'react';
import styles from './orderDetails.module.css';
import Icon from '@/components/icons/Icon';

interface InfoRowProps {
    label: string;
    value: string;
    rightValue?: string;
    showArrow?: boolean;
    onClick?: () => void;
}

const InfoRow: React.FC<InfoRowProps> = ({ label, value, rightValue, showArrow, onClick }) => {
    return (
        <div className={styles.infoRow} onClick={onClick}>
            <div className={styles.infoRowContent}>
                <p className={styles.infoRowLabel}>{label}</p>
                <div className={styles.infoRowValueContainer}>
                    <p className={styles.infoRowValue}>{value}</p>
                    {rightValue && <p className={styles.infoRowRightValue}>{rightValue}</p>}
                </div>
            </div>
            {showArrow && (
                <Icon name="rightArrow" size={20} color="var(--textPrimary)" />
            )}
        </div>
    );
};

export default InfoRow;

