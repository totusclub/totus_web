import styles from './hotelCard.module.css';
import Icon from "@/components/icons/Icon";
import Button from "@/components/UI/button";
import {router} from "next/client";

interface HotelCardItemProps {
    id:number,
    name:string,
    rate:number,
    city:string,
    price:number,
    tags:string[],
    date:string,
    night:string,
    image:string
}
interface HotelCardState {
    item: HotelCardItemProps
}


const HotelCard = ({item}: HotelCardState) => {
    const handleClick = () => {
        router.push('/hotel-details'); // Navigate to /about
    };
    return (
        <div className={styles.hotelCard}>
            <div className={styles.hotelCardImage} style={{backgroundImage: `url(${item?.image})`}}/>
            <div className={styles.hotelCardInfo}>
                <div className={styles.hotelCardHead}>
                    <div className={styles.hotelCardCity}>
                        <Icon name={'hotel'} size={14}/>
                        <p>{item.city}</p>
                    </div>
                    <div className={styles.hotelCardRate}>
                        <Icon name={'star'} size={14}/>
                        <p>{item.rate} ･ Превосходно</p>
                    </div>
                </div>
                <div className={styles.hotelCardName}>
                    <p>{item.name}</p>
                </div>
                <div className={styles.hotelCardTags}>
                    {item.tags.map(tag => (
                        <div className={styles.hotelCardTagItem} key={tag}>
                            <p>{tag}</p>
                        </div>
                    ))}
                </div>

            </div>
            <div className={styles.hotelCardPrice}>
                <div className={styles.hotelCardDate}>
                    <p>c {item.date}, на {item.night} ночей</p>
                </div>
                <div className={styles.hotelCardCheckout}>
                    <p>{item.price}₽</p>
                    <Button onClick={()=>handleClick()} full={true} title={'Выбрать'}/>
                </div>

            </div>

        </div>
    );
};

export default HotelCard;
