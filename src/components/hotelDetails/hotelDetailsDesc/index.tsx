import styles from '../hotelDetails.module.css';


const HotelDetailsDesc = ({info}:any) => {
    return (
        <div>
            <div className={styles.HotelDetailsDesc}>
                <div className={styles.HotelDetailsDescHead}>
                    <p>Описание</p>
                </div>
                <div className={styles.HotelDetailsDescText}>
                    <p>{`${info?.hotel_info}`}</p>
                </div>
            </div>
            {/*<div className={styles.HotelDetailsDesc}>*/}
            {/*    <div className={styles.HotelDetailsDescHead}>*/}
            {/*        <p>Развлечения</p>*/}
            {/*    </div>*/}
            {/*    <div className={styles.HotelDetailsDescItems}>*/}
            {/*        {info?.attractions?.map((item,index) => (*/}
            {/*            <div key={index} className={styles.HotelDetailsDescItem}>*/}
            {/*                <p>{item}</p>*/}
            {/*            </div>*/}
            {/*        ))}*/}
            {/*    </div>*/}
            {/*</div>*/}
            {/*<div className={styles.HotelDetailsDesc}>*/}
            {/*    <div className={styles.HotelDetailsDescHead}>*/}
            {/*        <p>Территория</p>*/}
            {/*    </div>*/}
            {/*    <div className={styles.HotelDetailsDescItems}>*/}
            {/*        {info?.territory?.map((item,index) => (*/}
            {/*            <div key={index} className={styles.HotelDetailsDescItem}>*/}
            {/*                <p>{item}</p>*/}
            {/*            </div>*/}
            {/*        ))}*/}
            {/*    </div>*/}
            {/*</div>*/}
        </div>
    );
};

export default HotelDetailsDesc;
