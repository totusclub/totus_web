import LogoIcon from '@/components/icons/logo';
import styles from '../hotelDetails.module.css';

const RoomImagePlaceholder = () => (
    <div
        className={styles.HotelDetailsRoomImagePlaceholder}
        aria-label="Изображение номера отсутствует"
    >
        <div className={styles.HotelDetailsRoomImagePlaceholderInner}>
            <LogoIcon className={styles.HotelDetailsRoomImagePlaceholderLogo} />
        </div>
    </div>
);

export default RoomImagePlaceholder;
