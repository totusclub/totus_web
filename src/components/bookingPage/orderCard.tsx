import styles from './booking.module.css';
import Button from "@/components/UI/button";
import Icon from "@/components/icons/Icon";
import {router} from "next/client";




const BookingOrderCard = () => {
    return (
        <div className={styles.bookingCardWrap}>
            <div className={styles.bookingCard}>
                <div className={styles.bookingCardHead}>
                    <p>Ваш заказ</p>
                </div>
                <div className={styles.bookingCardInfo}>
                    <div className={styles.bookingCardInfoItem}>
                        <p>Тур в Шарм-эль-Шейх, Египет</p>
                        <p>120 593 ₽</p>
                    </div>
                    <div className={styles.bookingCardInfoItem}>
                        <p>14 – 21 мая, на 7 ночей</p>
                    </div>
                </div>
                <div className={styles.bookingLine}/>
                <div className={styles.bookingCardPrice}>
                    <p>Итого</p>
                    <p>120 593 ₽</p>
                </div>
                <div className={styles.bookingCardFooter}>
                    <Button onClick={()=>router.push('checkout')} title={'Перейти к оформлению'} full={true}/>
                    <div className={styles.bookingCardText}>
                        <p>Нажимая на кнопку, вы ознакомлены и соглашаетесь с <span>Политикой по перс. данным</span> и <span>Условиями продажи</span>, в т.ч. с потреб. свойствами Тура, указанными в Заказе</p>
                    </div>
                </div>
            </div>
            <div className={styles.orderInformation}>
            <div className={styles.orderInformationHead}>
                <p>Туры раскупают — цены меняются</p>
                <Icon name={'closeLine'}/>
            </div>
                <div className={styles.orderInformationBody}>
                    <Icon name={'travel'} size={61}/>
                    <p>Каждую секунду цены могут меняться</p>
            </div>

            </div>
        </div>
    );
};

export default BookingOrderCard;
