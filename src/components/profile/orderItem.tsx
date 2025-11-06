import styles from './profile.module.css'
import {useMemo} from "react";

const OrderItem = ({item}:any) => {


    const statusColor = {
        pending:'var(--primary_blue)',
        approved:'var(--primary_green)',
        cancel:'var(--bgTertiary)',
    }
    const statusText = {
        pending:'В обработке',
        approved:'Потверждено',
        cancel:'Отменено',
    }
    const formatDate = useMemo(()=>{
        if(item){
            const startDate = new Date(item?.package?.package?.dates_info?.start_date);
            const endDate = new Date(item?.package?.package?.dates_info?.end_date);

            const formatter = new Intl.DateTimeFormat("ru-RU", {
                day: "numeric",
                month: "long"
            });

            const weekdayFormatter = new Intl.DateTimeFormat("ru-RU", {
                weekday: "short"
            });

            const startDay = formatter.format(startDate);
            const startWeekday = weekdayFormatter.format(startDate);

            const endDay = formatter.format(endDate);
            const endWeekday = weekdayFormatter.format(endDate);
            return `${startDay}, ${startWeekday} – ${endDay}, ${endWeekday}`;
        }

    },[item])

    // console.log('item.package.status',item)

    return (
        <div className={`${styles.orderItem} ${styles[item.package.status]}`}>
            <div className={styles.orderItemHead}>
                <div className={styles.orderItemHeadLeft}>
                    <p>Тур <span className={styles.orderItemId}>№ {item?.order_id}</span> <span style={{backgroundColor:statusColor[item.package.state]}}  className={styles.orderItemStatus}>{statusText[item.package.state]}</span></p>
                    <p className={styles.orderItemDate}>От 12 июня</p>
                </div>
                <div className={styles.orderItemPrices}>
                    <p className={styles.orderItemPrice}>{item?.package?.price.toString()?.replace(/\B(?=(\d{3})+(?!\d))/g, '\u202F')} ₽</p>
                    <p>Банковская карта</p>
                </div>
            </div>
            <div className={styles.orderItemInfo}>
                <p>{item.package.package.hotel.city}, {item.package.package.hotel.country}</p>
                <p>{formatDate}</p>
                <p>{item.flight}</p>
                <p>Туристы:
                    {item.package.tourists.map((t: any,index:number) => (
                        <span>{t.name} {t.surname}{index < item.package?.tourists?.length-1 && ', '}</span>
                    ))}

                </p>
            </div>

        </div>
    );
};

export default OrderItem;
