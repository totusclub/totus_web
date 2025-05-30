import {useState} from "react";
import styles from '../hotelDetails.module.css';
import VerticalSlider from "@/components/UI/verticalSlide";
import Button from "@/components/UI/button";
import Icon from "@/components/icons/Icon";
import TrackPrices from "@/components/UI/trackPrices";
import {router} from "next/client";


const HotelDetailsInfo = () => {
const [priceTrack, setPriceTrack] = useState<boolean>(false);
const handelBook = ()=>{
    router.push("/tickets");
}
    return (
        <div className={styles.HotelDetailsInfoRow}>
            <VerticalSlider/>
            <div className={styles.HotelDetailsInfo}>
                <div className={styles.HotelDetailsInfoPrice}>
                    <p className={styles.HotelDetailsInfoPriceText}>от 1 396 810 ₽</p>
                    <div className={styles.HotelDetailsInfoDate}>
                        <p className={styles.HotelDetailsInfoDateTitle}>Цена за тур с перелётом</p>
                        <p className={styles.HotelDetailsInfoDateText}>с 8 мая, 7 ночей, 1 взрослый</p>
                    </div>
                    <Button onClick={()=>handelBook()} title={'Выбрать номер'} full={true}/>
                </div>
                <div className={styles.HotelDetailsInfoMessage}>
                    <div className={styles.HotelDetailsInfoMessageIcon}>
                        <Icon name={'travel'} size={61} />
                    </div>
                    <p className={styles.HotelDetailsInfoMessageText}>Это место предлагает уникальный опыт, сочетая роскошь и природу. Мы здесь, чтобы помочь вам осуществить вашу мечту о путешествии!</p>
                </div>
                <TrackPrices text={'Автоматические оповещения \n при изменении цен.'} priceTrack={priceTrack} setPriceTrack={setPriceTrack}/>
            </div>
        </div>
    );
};

export default HotelDetailsInfo;
