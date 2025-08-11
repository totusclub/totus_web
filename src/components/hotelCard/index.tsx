import styles from './hotelCard.module.css';
import Icon from "@/components/icons/Icon";
import Button from "@/components/UI/button";
import {router} from "next/client";
import {useMemo} from "react";

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
    request_id:string
}


const HotelCard = ({item,request_id}: HotelCardState) => {
    const handleClick = () => {
        router.push(`/hotel-details?request_id=${request_id}&hotel_id=${item?.hotel?.id}`); // Navigate to /about
    };
    // console.log(item);
    const {hotel,analytics_min_price,min_price_nights,dates} = item;

    const formattedDate = useMemo(() => {
        const dateKey = Object.keys(dates)[0];
        const date = new Date(dateKey);
        return date.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' });
    }, [dates]);


    const formatHotelInfoToRussian = (data: Record<string, any>) => {
        const labels: Record<string, string> = {
            construction_year: 'Год постройки',
            renovation_year: 'Год реновации',
            airport_distance: 'до аэропорта',
            beach_distance: 'до пляжа',
            beach_size: 'Размер пляжа',
            beach_type: 'Тип пляжа',
            beach_surface: 'Покрытие пляжа',
            area: 'Площадь территории',
            line: 'Береговая линия',
            wi_fi: 'Wi-Fi',
            ski_lift_distance: 'до подъемника',
            ski_in: 'Выход на склон (ski-in)',
            ski_out: 'Выход со склона (ski-out)',
            fitness: 'Фитнес',
            aquapark: 'Аквапарк',
            nanny: 'Няня',
            kids_menu: 'Детское меню',
            kids_club: 'Детский клуб',
            kids_pool: 'Детский бассейн',
            pool: 'Бассейн',
            heated_pool: 'Подогреваемый бассейн',
            aircon: 'Кондиционер',
            parking: 'Парковка',
            massage: 'Массаж',
            thermal_fun: 'Термальные процедуры',
            bar: 'Бар',
            indoor_pool: 'Крытый бассейн',
            no_single_men: 'Без одиноких мужчин',
            min_age: 'Минимальный возраст',
        };

        const ignoredKeys = ['construction_year', 'renovation_year','area','beach_type','beach_size','no_single_men','thermal_fun'];

        return Object.entries(data)
            .filter(([key, value]) => value !== null && value !== false && !ignoredKeys.includes(key))
            .map(([key, value]) => {
                const label = labels[key] || key;

                // Handle distance fields: convert to km
                if (['airport_distance', 'beach_distance', 'ski_lift_distance'].includes(key)) {
                    if (value < 1000) {
                        return `${value} м ${label}`;
                    } else {
                        const km = Math.round(value / 1000);
                        return `${km} км ${label}`;
                    }
                }

                if (typeof value === 'string' && value === 'FREE') {
                    return `бесплатно ${label}`;
                }
                if (typeof value === 'string' && value === 'PAID') {
                    return `платный ${label}`;
                }
                if (typeof value === 'string' && value === 'LOBBY_FREE') {
                    return `Бесплатный ${label} в фойе`;
                }
                if (typeof value === 'string' && value === 'LOBBY_PAID') {
                    return `платный ${label} в фойе`;
                }

                if (typeof value === 'boolean') {
                    return label;
                }

                const units: Record<string, string> = {
                    area: 'м²',
                };

                if (key === 'line') {
                    return `${value}-я линия`;
                }
                if (key === 'beach_surface') {
                    if(value === 'PEBBLE'){
                        return 'Галька'
                    }else if(value === 'SAND+PEBBLE'){
                        return 'Песок с галькой'
                    }else{
                        return `${value}-${key}`;
                    }

                }

                const unit = units[key] || '';
                return `${label}: ${value}${unit}`;
            });
    };



    const TAGS = useMemo(() => {
        if(hotel.features){
            const result = formatHotelInfoToRussian(hotel.features);
            // console.log('result',result);
            return result
        }else{
            return [];
        }
    }, [hotel.features]);


    // const imageShow = useMemo(()=>(){
    //     if(hotel?.images.length > 0){}
    // },[hotel])
    const showImage = useMemo(() => {
        if(hotel?.images.length > 0){
           return  hotel?.images?.[0]['x500'];
        }
    },[hotel])


    return (
        <div onClick={()=>handleClick()} className={styles.hotelCard}>
            <div className={styles.hotelCardImage} style={{backgroundImage: `url(${showImage})`}}/>

            <div className={styles.hotelCardInfo}>
                <div className={styles.hotelCardHead}>
                    <div className={styles.hotelStart}>
                        <Icon name={'star'} size={18}
                              color={hotel?.stars >= 1 ? 'var(--core_Orange)' : 'var(--bgSecondary)'}/>
                        <Icon name={'star'} size={18}
                              color={hotel?.stars >= 2 ? 'var(--core_Orange)' : 'var(--bgSecondary)'}/>
                        <Icon name={'star'} size={18}
                              color={hotel?.stars >= 3 ? 'var(--core_Orange)' : 'var(--bgSecondary)'}/>
                        <Icon name={'star'} size={18}
                              color={hotel?.stars >= 4 ? 'var(--core_Orange)' : 'var(--bgSecondary)'}/>
                        <Icon name={'star'} size={18}
                              color={hotel?.stars >= 5 ? 'var(--core_Orange)' : 'var(--bgSecondary)'}/>
                    </div>
                    <div className={styles.hotelCardName}>
                        <p>{hotel?.name}</p>
                    </div>
                    <div className={styles.hotelCardImageInfoM}>
                        <p><Icon name={'message'} size={14}
                                 color="#000"/> {hotel.reviews_count > 0 ? `${hotel.reviews_count} отзывов` : 'нет отзывов'}
                        </p>
                        {hotel?.rating > 0 && (
                            <p>{hotel.rating}</p>
                        )}
                    </div>

                </div>
                <div className={styles.hotelCardTags}>
                    {TAGS?.map(tag => (
                        <div className={styles.hotelCardTagItem} key={tag}>
                            <p>{tag}</p>
                        </div>
                    ))}
                </div>
                <div className={styles.hotelCardPriceM}>
                    <p>{analytics_min_price.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '\u202F')}₽</p>
                    <p>от {formattedDate}, на {min_price_nights} ночей</p>
                </div>

            </div>
            <div className={styles.hotelCardPrice}>
            <div className={styles.hotelCardImageInfo}>
                    <p><Icon name={'message'} size={14} color="#000" /> {hotel.reviews_count > 0 ? `${hotel.reviews_count} отзывов`:'нет отзывов'}</p>
                    {hotel?.rating > 0 &&(
                        <p>{hotel.rating}</p>
                    )}

                </div>
                <div className={styles.hotelCardCheckout}>
                    <p>{analytics_min_price.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '\u202F')}₽</p>
                    <Button onClick={() => handleClick()} full={true} title={'Выбрать'}/>
                    <div className={styles.hotelCardDate}>
                        <p>c {formattedDate}, на {min_price_nights} ночей</p>
                    </div>
                </div>

            </div>

        </div>
    );
};

export default HotelCard;
