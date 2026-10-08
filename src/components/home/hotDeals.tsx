import React, { CSSProperties } from "react";
import Slider from "react-slick";
import "slick-carousel/slick/slick.css";
import styles from './home.module.css'
import HotelBoxCard from "@/components/hotelBox/hotelBoxCard";
import Icon from "@/components/icons/Icon";
import { useRouter } from "next/router";
import { buildHotelDetailsDeepLinkQuery } from "@/utils/hotelDetailsUtils";
import { useNearViewport } from "@/hooks/useNearViewport";
import { useAfterPageLoad } from "@/hooks/useAfterPageLoad";

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

export default function HotDealsSlide({ slidesToShow, title, recomendHotels }: { slidesToShow: number, title: string, recomendHotels?: HotelItem[] | null }) {
    const router = useRouter();
    // Фото отелей грузим, когда блок рядом с экраном (PageSpeed: не мешать главной картинке).
    // На телефоне блок виден уже на первом экране — поэтому ещё и только после загрузки страницы:
    // 3 фото по ~110 КБ больше не делят канал с картинкой hero (LCP).
    const [desktopListRef, desktopListVisible] = useNearViewport<HTMLDivElement>();
    const [mobileListRef, mobileListVisible] = useNearViewport<HTMLDivElement>();
    const pageLoaded = useAfterPageLoad();

    const handlePressHotel = React.useCallback(
        (hotelId: number | string) => {
            if (!hotelId) {
                return;
            }

            router.push({
                pathname: '/hotel-details',
                query: buildHotelDetailsDeepLinkQuery(hotelId),
            }, undefined, { shallow: false });
        },
        [router]
    );

    const settings = {
        dots: true,
        infinite: true,
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
                    // Без бесконечной прокрутки: при дробном slidesToShow react-slick с infinite
                    // сдвигает ленту на 0,2 карточки — первая карточка обрезалась слева на телефоне.
                    // Теперь первая карточка у левого края, следующая выглядывает справа.
                    infinite: false,
                    dots: false,
                    arrows: false
                }
            }

        ]
    };
    return (
        <div className={`${styles.contentFull} ${styles.contentFullHide}`}>
            <p className={styles.hotProductTitle}>{title}</p>
            <div className={styles.recomendlist} ref={desktopListRef}>
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
                        showImage={desktopListVisible && pageLoaded}
                        url=""
                        onClick={() => handlePressHotel(item.id)}
                    />
                ))}
            </div>
            <div className={styles.recomendlistMob} ref={mobileListRef}>
                <Slider {...settings}>
                    {recomendHotels?.map((item: HotelItem, index: number) => (
                        <div key={item.id ?? index} className={styles.hotDealSlide}>
                            <HotelBoxCard
                                id={typeof item.id === 'number' ? item.id : Number(item.id) || 0}
                                name={item.name || ''}
                                rate={item.rate || 0}
                                city={item.city || ''}
                                price={item.price || 0}
                                review={item.review || 0}
                                image={item.image || ''}
                                showImage={mobileListVisible && pageLoaded}
                                url=""
                                onClick={() => handlePressHotel(item.id)}
                            />
                        </div>
                    ))}
                </Slider>
            </div>
        </div>
    );
}
