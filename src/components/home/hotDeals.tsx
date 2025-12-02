import React, { CSSProperties, useMemo } from "react";
import Slider from "react-slick";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
import styles from './home.module.css'
import HotelBoxCard from "@/components/hotelBox/hotelBoxCard";
import Icon from "@/components/icons/Icon";
import { useRouter } from "next/router";

interface HotelItem {
    id: number | string;
    name?: string;
    rate?: number;
    city?: string;
    price?: number;
    review?: number;
    image?: string;
    url?: string;
}
interface ArrowProps {
    onClick?: () => void;
    className?: string;
    style?: CSSProperties;
}

const NextArrow = ({ onClick }: ArrowProps) => {
    return (
        <div className={styles.nextArrowHot} onClick={onClick}>
            <Icon name="rightArrow" size={24} color="#000" />
        </div>
    );
};

const PrevArrow = ({ onClick }: ArrowProps) => {
    return (
        <div className={styles.prevArrowHot} onClick={onClick}>
            <Icon name="leftArrow" size={24} color="#000" />
        </div>
    );
};

// Helper function to get default start date (7 days from today)
const getDefaultStartDate = (): string => {
    const today = new Date();
    const plus7 = new Date();
    plus7.setDate(today.getDate() + 7);
    const year = plus7.getFullYear();
    const month = String(plus7.getMonth() + 1).padStart(2, '0');
    const day = String(plus7.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

export default function HotDealsSlide({ slidesToShow, title, recomendHotels }: { slidesToShow: number, title: string, recomendHotels?: HotelItem[] | null }) {
    const router = useRouter();
    const date = useMemo(() => {
        return getDefaultStartDate();
    }, []);

    const handlePressHotel = React.useCallback(
        (hotelId: number | string) => {
            if (!hotelId) {
                return;
            }

            // Build search params similar to React Native app
            const queryParams = {
                hotel_id: String(hotelId),
                from_city: "Moscow",
                from_country: "RU",
                to_country: "RU",
                to_city: "",
                adults: "2",
                start_date: date,
                nights: "7",
                search_type: "package",
                flex_dates: "2",
            };

            // Navigate to hotel-details with search params using object format
            // Use shallow: false to ensure fresh navigation and prevent conflicts
            router.push({
                pathname: '/hotel-details',
                query: queryParams,
            }, undefined, { shallow: false });
        },
        [router, date]
    );

    const settings = {
        dots: true,
        infinite: false,
        speed: 500,
        slidesToShow: slidesToShow,
        slidesToScroll: slidesToShow,
        initialSlide: 0,
        nextArrow: <NextArrow />,
        prevArrow: <PrevArrow />,
        appendDots: (dots: number) => (
            <div className={styles.customDotsWrapper}>
                <ul> {dots} </ul>
            </div>
        ),
        customPaging: () => (
            <div className={styles.customDot} />
        ),
        responsive: [
            {
                breakpoint: 1024,
                settings: {
                    slidesToShow: 3,
                    slidesToScroll: 3,
                    infinite: true,
                    dots: true
                }
            },
            {
                breakpoint: 600,
                settings: {
                    slidesToShow: 2,
                    slidesToScroll: 2,
                    initialSlide: 2
                }
            },
            {
                breakpoint: 480,
                settings: {
                    slidesToShow: 1.2,
                    slidesToScroll: 1,
                    dots: false,
                    arrows: false
                }
            }

        ]
    };
    return (
        <div className={`${styles.contentFull} ${styles.contentFullHide}`}>
            <p className={styles.hotProductTitle}>{title}</p>
            <div className={styles.recomendlist}>
                {recomendHotels?.map((item: HotelItem, index: number) => (
                    <HotelBoxCard
                        key={item.id ?? index}
                        id={typeof item.id === 'number' ? item.id : Number(item.id) || 0}
                        name={item.name || ''}
                        rate={item.rate || 0}
                        city={item.city || ''}
                        price={item.price || 0}
                        review={item.review || 0}
                        image={item.image || ''}
                        url=""
                        onClick={() => handlePressHotel(item.id)}
                    />
                ))}
            </div>
            <div className={styles.recomendlistMob}>
                <Slider {...settings}>
                    {recomendHotels?.map((item: HotelItem, index: number) => (
                        <HotelBoxCard
                            key={item.id ?? index}
                            id={typeof item.id === 'number' ? item.id : Number(item.id) || 0}
                            name={item.name || ''}
                            rate={item.rate || 0}
                            city={item.city || ''}
                            price={item.price || 0}
                            review={item.review || 0}
                            image={item.image || ''}
                            url=""
                            onClick={() => handlePressHotel(item.id)}
                        />
                    ))}
                </Slider>
            </div>
        </div>
    );
}
