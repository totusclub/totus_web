import styles from './hotelCard.module.css';
import Icon from "@/components/icons/Icon";
import Button from "@/components/UI/button";
import { useRouter } from "next/router";
import { useMemo } from "react";

interface HotelCardItemProps {
    id: number,
    name: string,
    rate: number,
    city: string,
    price: number,
    tags: string[],
    date: string,
    night: string,
    image: string
}
interface HotelCardState {
    item: HotelCardItemProps
    request_id: string,
    lazy?: boolean
}


const HotelCard = ({ item, request_id, lazy }: HotelCardState) => {
    const router = useRouter();
    
    const handleClick = () => {
        sessionStorage.setItem("searchScroll", window.scrollY.toString());
        
        // Get all search params from current URL query
        const queryParams: Record<string, string | string[]> = {
            hotel_id: String(item?.hotel?.id),
            request_id: request_id || '',
            from_city: (router.query.from_city as string) || 'Moscow',
            from_country: (router.query.from_country as string) || 'RU',
            to_country: (router.query.to_country as string) || '',
            to_city: (router.query.to_city as string) || '',
            adults: (router.query.adults as string) || '2',
            start_date: (router.query.start_date as string) || '',
            nights: (router.query.nights as string) || '7',
            search_type: (router.query.search_type as string) || 'package',
            flex_dates: (router.query.flex_dates as string) || '2',
        };

        // Add optional params if they exist
        if (router.query.kids) {
            queryParams.kids = router.query.kids as string;
        }
        if (router.query.kids_ages) {
            queryParams.kids_ages = Array.isArray(router.query.kids_ages) 
                ? router.query.kids_ages 
                : [router.query.kids_ages as string];
        }

        router.push({
            pathname: '/hotel-details',
            query: queryParams,
        }, undefined, { shallow: false });
    };
    // console.log(item);


    const { hotel, analytics_min_price, min_price_nights, dates } = item ?? {};


    const formattedDate = useMemo(() => {
        if (dates) {
            const dateKey = Object.keys(dates)[0];
            const date = new Date(dateKey);
            return date.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' });
        }
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

        const ignoredKeys = ['construction_year', 'renovation_year', 'area', 'beach_type', 'beach_size', 'no_single_men', 'thermal_fun'];

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
                    if (value === 'PEBBLE') {
                        return 'Галька'
                    } else if (value === 'SAND+PEBBLE') {
                        return 'Песок с галькой'
                    } else {
                        return `${value}-${key}`;
                    }
                }

                const unit = units[key] || '';
                return `${label}: ${value}${unit}`;
            });
    };



    const TAGS = useMemo(() => {
        if (hotel?.features) {
            const result = formatHotelInfoToRussian(hotel.features);
            return result
        } else {
            return [];
        }
    }, [hotel?.features]);


    const showImage = useMemo(() => {
        if (hotel?.images?.length > 0) {
            let path = hotel.images[0]?.webp_x620 || hotel.images[0].x500 || "";
            // Remove the prefix
            // console.log('path.replace("https://img.cdn.level.travel/", "")',path.replace("https://img.cdn.level.travel/", ""));
            // return path.replace("https://img.cdn.level.travel/", "");
            return path
        }
        return "";
    }, [hotel]);

    if (!lazy) {
        return (
            <div onClick={() => handleClick()} className={styles.hotelCard}>
                {/*<div className={styles.hotelCardImage} style={{backgroundImage: `url(https://image.totus.club/imagePath?directory=${showImage})`}}/>*/}
                <div className={styles.hotelCardImage} style={{ backgroundImage: `url(${showImage})` }} />

                <div className={styles.hotelCardInfo}>
                    <div className={styles.hotelCardHead}>
                        <div className={styles.hotelStart}>
                            <Icon name={'star'} size={18}
                                color={hotel?.stars >= 1 ? 'var(--core_Orange)' : 'var(--bgSecondary)'} />
                            <Icon name={'star'} size={18}
                                color={hotel?.stars >= 2 ? 'var(--core_Orange)' : 'var(--bgSecondary)'} />
                            <Icon name={'star'} size={18}
                                color={hotel?.stars >= 3 ? 'var(--core_Orange)' : 'var(--bgSecondary)'} />
                            <Icon name={'star'} size={18}
                                color={hotel?.stars >= 4 ? 'var(--core_Orange)' : 'var(--bgSecondary)'} />
                            <Icon name={'star'} size={18}
                                color={hotel?.stars >= 5 ? 'var(--core_Orange)' : 'var(--bgSecondary)'} />
                        </div>
                        <div className={styles.hotelCardName}>
                            <p>{hotel?.name}</p>
                        </div>
                        <div className={styles.hotelCardImageInfoM}>
                            <p><Icon name={'message'} size={14}
                                color="#000" /> {hotel?.reviews_count > 0 ? `${hotel?.reviews_count} отзывов` : 'нет отзывов'}
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
                        <p>{analytics_min_price?.toString()?.replace(/\B(?=(\d{3})+(?!\d))/g, '\u202F')}₽</p>
                        <p>от {formattedDate}, на {min_price_nights} ночей</p>
                    </div>

                </div>
                <div className={styles.hotelCardPrice}>
                    <div className={styles.hotelCardImageInfo}>
                        <p><Icon name={'message'} size={14} color="#000" /> {hotel?.reviews_count > 0 ? `${hotel?.reviews_count} отзывов` : 'нет отзывов'}</p>
                        {hotel?.rating > 0 && (
                            <p>{hotel.rating}</p>
                        )}
                    </div>
                    <div className={styles.hotelCardCheckout}>
                        <p>{analytics_min_price?.toString()?.replace(/\B(?=(\d{3})+(?!\d))/g, '\u202F')}₽</p>
                        <Button onClick={() => handleClick()} full={true} title={'Выбрать'} />
                        <div className={styles.hotelCardDate}>
                            <p>c {formattedDate}, на {min_price_nights} ночей</p>
                        </div>
                    </div>
                </div>
            </div>
        );
    } else {
        return (
            <div className={styles.hotelCard}>
                {/* Image Section - 212px × 152px */}
                <div className={styles.image_placeholder}></div>

                {/* Info Section - flex: 1 */}
                <div className={styles.hotelCardInfo}>
                    {/* Header Section */}
                    <div className={styles.hotelCardHead}>
                        {/* Star Rating */}
                        <div className={styles.hotelStart}>
                            <Icon name={'star'} size={18} color={'var(--bgSecondary)'} />
                            <Icon name={'star'} size={18} color={'var(--bgSecondary)'} />
                            <Icon name={'star'} size={18} color={'var(--bgSecondary)'} />
                            <Icon name={'star'} size={18} color={'var(--bgSecondary)'} />
                            <Icon name={'star'} size={18} color={'var(--bgSecondary)'} />
                        </div>
                        {/* Hotel Name */}
                        <div className={styles.hotelCardName}>
                            <div className={styles.animationTextlazy} style={{ width: '85%', height: '24px' }}></div>
                        </div>
                        {/* Mobile Reviews Info */}
                        <div className={styles.hotelCardImageInfoM}>
                            <div className={styles.animationTextlazy} style={{ width: '120px', height: '12px' }}></div>
                            <div className={styles.animationTextlazy} style={{ width: '35px', height: '12px' }}></div>
                        </div>
                    </div>

                    {/* Tags Section */}
                    <div className={styles.hotelCardTags}>
                        <div className={styles.hotelCardTagItem}>
                            <div className={styles.animationTaglazy} style={{ width: '70px', height: '16px' }}></div>
                        </div>
                        <div className={styles.hotelCardTagItem}>
                            <div className={styles.animationTaglazy} style={{ width: '95px', height: '16px' }}></div>
                        </div>
                        <div className={styles.hotelCardTagItem}>
                            <div className={styles.animationTaglazy} style={{ width: '80px', height: '16px' }}></div>
                        </div>
                        <div className={styles.hotelCardTagItem}>
                            <div className={styles.animationTaglazy} style={{ width: '60px', height: '16px' }}></div>
                        </div>
                    </div>

                    {/* Mobile Price Section */}
                    <div className={styles.hotelCardPriceM}>
                        <div className={styles.animationTextlazy} style={{ width: '110px', height: '20px' }}></div>
                        <div className={styles.animationTextlazy} style={{ width: '160px', height: '14px' }}></div>
                    </div>
                </div>

                {/* Price Section - 160px width */}
                <div className={styles.hotelCardPrice}>
                    {/* Desktop Reviews Info */}
                    <div className={styles.hotelCardImageInfo}>
                        <div className={styles.animationTextlazy} style={{ width: '120px', height: '12px' }}></div>
                        <div className={styles.animationTextlazy} style={{ width: '35px', height: '12px' }}></div>
                    </div>

                    {/* Checkout Section */}
                    <div className={styles.hotelCardCheckout}>
                        {/* Price */}
                        <div className={styles.animationTextlazy} style={{ width: '110px', height: '20px' }}></div>
                        {/* Button */}
                        <div className={styles.leazyButton}></div>
                        {/* Date Info */}
                        <div className={styles.hotelCardDate}>
                            <div className={styles.animationTextlazy} style={{ width: '160px', height: '14px' }}></div>
                        </div>
                    </div>
                </div>
            </div>
        )
    }
};

export default HotelCard;
