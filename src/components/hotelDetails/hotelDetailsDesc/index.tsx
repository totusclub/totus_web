import styles from '../hotelDetails.module.css';


const HotelDetailsDesc = () => {
    return (
        <div className={styles.HotelDetailsDesc}>
            <div className={styles.HotelDetailsDescHead}>
                <p>Описание</p>
            </div>
            <div className={styles.HotelDetailsDescItems}>
                <div className={styles.HotelDetailsDescItem}>
                    <p>1-я линия</p>
                </div>
                <div className={styles.HotelDetailsDescItem}>
                    <p>Песок</p>
                </div>
                <div className={styles.HotelDetailsDescItem}>
                    <p>12 км до пляжа</p>
                </div>
                <div className={styles.HotelDetailsDescItem}>
                    <p>20 км до аэропорта</p>
                </div>
                <div className={styles.HotelDetailsDescItem}>
                    <p>Бесплатный Wi-Fi</p>
                </div>
            </div>
            <div className={styles.HotelDetailsDescText}>
                <p>Отель расположен в прибрежной зоне, в регионе, который может похвастаться своими красивыми мангровыми лесами и богатыми культурными традициями, которые запечатлены в местной архитектуре. Великолепные залы этого комплекса оформлены в арабском стиле и имеют сводчатые потолки.</p>
            </div>
        </div>
    );
};

export default HotelDetailsDesc;
