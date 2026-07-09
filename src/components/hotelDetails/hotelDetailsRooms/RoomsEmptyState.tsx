import styles from '../hotelDetails.module.css';
import RoomsNotFoundIllustration from './RoomsNotFoundIllustration';
import type { ReactNode } from 'react';

type RoomsEmptyStateProps = {
    title: string;
    description?: string;
    compact?: boolean;
    children?: ReactNode;
};

const RoomsEmptyState = ({ title, description, compact = false, children }: RoomsEmptyStateProps) => (
    <div
        className={
            compact
                ? styles.HotelDetailsRoomsEmpty
                : styles.HotelDetailsRoomsNotFound
        }
        role="status"
    >
        <RoomsNotFoundIllustration />
        <h3 className={styles.HotelDetailsRoomsNotFoundTitle}>{title}</h3>
        {description ? (
            <p className={styles.HotelDetailsRoomsNotFoundText}>{description}</p>
        ) : null}
        {children}
    </div>
);

export default RoomsEmptyState;
