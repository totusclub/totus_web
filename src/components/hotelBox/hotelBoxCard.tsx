import styles from './hotelBox.module.css';
import Icon from "@/components/icons/Icon";
import {router} from "next/client";

interface ProductCardProps {
    id:number,
    name:string,
    rate:number,
    city:string,
    price:number,
    review:number,
    image:string,
    url:string,
    onClick?: (e: React.MouseEvent) => void;
}


const HotelBoxCard = ({id,name,rate,city,price,review,image,url, onClick }: ProductCardProps) => {
    const handleClick = (e: React.MouseEvent) => {
        // If custom onClick is provided, use it (for hotDeals navigation)
        if (onClick) {
            onClick(e);
            return;
        }
        
        // Otherwise, use url navigation if provided
        if (url && url.trim() !== '') {
            e.stopPropagation();
            router.push(url);
        }
    };

    return (
        <div onClick={handleClick} className={styles.hotelBoxCard} key={id} style={{ cursor: onClick ? 'pointer' : undefined }}>
            <div className={styles.hotelBoxCardImage} style={{backgroundImage: `url(${image})`}}>
                <div className={styles.hotelBoxCardImageInfo}>
                    <div className={styles.hotelBoxCardStatus}>
                        <p>Самый популярный</p>
                    </div>
                    {/*<div className={styles.hotelBoxCardFavorite}>*/}
                    {/*    <Icon name={'heart'} size={16} color="#000" />*/}
                    {/*</div>*/}
                </div>
            </div>
            <div className={styles.hotelBoxCardInfo}>
                <div className={styles.hotelBoxCardName}>
                    <p>{name}</p>
                    <div className={styles.hotelBoxCardStar}>
                        <Icon name={'star'} size={24} color="var(--core_Orange)" />
                        <span>{rate}</span>
                    </div>
                </div>
                <p className={styles.hotelBoxCardCity}>{city}</p>
                {/*<div className={styles.hotelBoxCardFooter}>*/}
                {/*    <p className={styles.hotelBoxCardPrice}>от {price} ₽</p>*/}
                {/*    <div className={styles.hotelBoxCardReview}>*/}
                {/*        <Icon name={'message'} size={24} color="#000" />*/}
                {/*        <span>{review} отзывов</span>*/}
                {/*    </div>*/}
                {/*</div>*/}
            </div>
        </div>
    );
};

export default HotelBoxCard;
