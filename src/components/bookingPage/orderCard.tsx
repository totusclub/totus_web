import styles from './booking.module.css';
import Button from "@/components/UI/button";
import Icon from "@/components/icons/Icon";
import { useMemo } from "react";




const BookingOrderCard = ({ packageData, handleSubmit, loading, dataLoading, isFormValid }: any) => {
    // console.log('packageData',packageData)

    const formatDate = useMemo(() => {
        if (packageData?.dates_info?.start_date && packageData?.dates_info?.end_date) {
            const startDate = new Date(packageData?.dates_info?.start_date);
            const endDate = new Date(packageData?.dates_info?.end_date);

            const formatterSameMonth = new Intl.DateTimeFormat('ru-RU', {
                day: 'numeric',
                month: 'long'
            });

            const formatterDifferentMonth = new Intl.DateTimeFormat('ru-RU', {
                day: 'numeric',
                month: 'long'
            });

            const sameMonth = startDate.getMonth() === endDate.getMonth();

            return sameMonth
                ? `${startDate.getDate()} ${formatterSameMonth.format(startDate).split(' ')[1]} – ${endDate.getDate()} ${formatterSameMonth.format(endDate).split(' ')[1]}`
                : `${formatterDifferentMonth.format(startDate)} – ${formatterDifferentMonth.format(endDate)}`;
        }


    }, [packageData])

    if (dataLoading || !packageData) {
        return (
            <div className={styles.bookingCardWrap}>
                <div className={styles.bookingCard}>
                    <div className={styles.bookingCardHead}>
                        <p>Ваш заказ</p>
                    </div>
                    <div className={styles.bookingCardInfo}>
                        <div className={styles.bookingCardInfoItem}>
                            <div className={styles.animationTextLazy} style={{ width: '60%', height: '20px' }}></div>
                            <div className={styles.animationTextLazy} style={{ width: '30%', height: '20px' }}></div>
                        </div>
                        <div className={styles.bookingCardInfoItem}>
                            <div className={styles.animationTextLazy} style={{ width: '50%', height: '20px' }}></div>
                        </div>
                    </div>
                    <div className={styles.bookingLine} />
                    <div className={styles.bookingCardPrice}>
                        <p>Итого</p>
                        <div className={styles.animationTextLazy} style={{ width: '30%', height: '24px' }}></div>
                    </div>
                    <div className={styles.bookingCardFooter}>
                        <div className={styles.ButtonLazy}></div>
                        <div className={styles.bookingCardText}>
                            <p>Нажимая на кнопку, вы ознакомлены и соглашаетесь с <span>Политикой по перс. данным</span> и <span>Условиями продажи</span>, в т.ч. с потреб. свойствами Тура, указанными в Заказе</p>
                        </div>
                    </div>
                </div>
                <div className={styles.orderInformation}>
                    <div className={styles.orderInformationHead}>
                        <p>Туры раскупают — цены меняются</p>
                        {/*<Icon name={'closeLine'} />*/}
                    </div>
                    <div className={styles.orderInformationBody}>
                        <Icon name={'travel'} size={61} />
                        <p>Каждую секунду цены могут меняться</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className={styles.bookingCardWrap}>
            <div className={styles.bookingCard}>
                <div className={styles.bookingCardHead}>
                    <p>Ваш заказ</p>
                </div>
                <div className={styles.bookingCardInfo}>
                    <div className={styles.bookingCardInfoItem}>
                        <p>Тур в {packageData?.hotel?.city}, {packageData?.hotel?.country}</p>
                        <p>{packageData?.price.toString()?.replace(/\B(?=(\d{3})+(?!\d))/g, '\u202F')} ₽</p>
                    </div>
                    <div className={styles.bookingCardInfoItem}>
                        <p>{formatDate}, на {packageData?.nights_count} ночей</p>
                    </div>
                </div>
                <div className={styles.bookingLine} />
                <div className={styles.bookingCardPrice}>
                    <p>Итого</p>
                    <p>{packageData?.price.toString()?.replace(/\B(?=(\d{3})+(?!\d))/g, '\u202F')} ₽</p>
                </div>
                <div className={styles.bookingCardFooter}>
                    <Button loading={loading} onClick={() => handleSubmit()} title={'Отправить запрос'} full={true} disabled={!isFormValid} />
                    <div className={styles.bookingCardText}>
                        <p>Нажимая на кнопку, вы ознакомлены и соглашаетесь с <span>Политикой по перс. данным</span> и <span>Условиями продажи</span>, в т.ч. с потреб. свойствами Тура, указанными в Заказе</p>
                    </div>
                </div>
            </div>
            <div className={styles.orderInformation}>
                <div className={styles.orderInformationHead}>
                    <p>Туры раскупают — цены меняются</p>
                    {/*<Icon name={'closeLine'} />*/}
                </div>
                <div className={styles.orderInformationBody}>
                    <Icon name={'travel'} size={61} />
                    <p>Каждую секунду цены могут меняться</p>
                </div>
            </div>
        </div>
    );

};

export default BookingOrderCard;
