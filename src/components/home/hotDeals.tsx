import React, {CSSProperties} from "react";
import Slider from "react-slick";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
import styles from './home.module.css'
import HotelBoxCard from "@/components/hotelBox/hotelBoxCard";
import Icon from "@/components/icons/Icon";
const MOCK_DATA= [
    {
        id:0,
        name:'Movenpick Resort Antalya Tekirova (Ex Royal Diwa Tekirova)',
        rate:5,
        city:'Текирова, Кемер',
        price:55723,
        review:196,
        image:'https://img.cdn.level.travel/hotels/36165/4d83acd7ab74c9d4fa1adca71d875c35_webp_x620.webp',
        url:'/search?from_city=Moscow&from_country=RU&to_country=TR&adults=2&start_date=2025-10-15&nights=7..9&flex_dates=2&start_date_from=2025-10-15&end_date_till=2025-10-22&search_type=package&page_limit=20&page_number=1&to_city=null&hotel_ids=36165'
    },
    {
        id:1,
        name:'Swissotel Sharm El Sheikh Managed By Rixos',
        rate:5,
        city:'Наама Бэй, Шарм-эль-Шейх',
        price:55723,
        review:10,
        image:'https://img.cdn.level.travel/hotels/9149847/def8891aa911a636e350e8438d9437ba_webp_x620.webp',
        url:'/search?from_city=Moscow&from_country=RU&to_country=EG&adults=2&start_date=2025-10-05&nights=7..9&flex_dates=2&start_date_from=2025-10-05&end_date_till=2025-10-12&search_type=package&page_limit=20&page_number=1&to_city=null&hotel_ids=9149847'
    },
    {
        id:2,
        name:'Cosmos Collection Altay Resort',
        rate:5,
        city:'Урлу-Аспак, Майминский район',
        price:55723,
        review:12,
        image:'https://img.cdn.level.travel/hotels/9085039/f58b3c014000931c90910baa6298598d_webp_x620.webp',
        url:'/search?from_city=Moscow&from_country=RU&to_country=RU&adults=2&start_date=2025-10-05&nights=7..9&flex_dates=2&start_date_from=2025-10-05&end_date_till=2025-10-12&search_type=package&page_limit=20&page_number=1&to_city=null&hotel_ids=9085039'
    },
    {
        id:3,
        name:'Swissotel Sharm El Sheikh Managed By Rixos',
        rate:5,
        city:'Египет',
        price:55723,
        review:10,
        image:'https://img.cdn.level.travel/hotels/9149847/def8891aa911a636e350e8438d9437ba_webp_x620.webp',
        url:'/search?from_city=Moscow&from_country=RU&to_country=EG&adults=2&start_date=2025-10-05&nights=7..9&flex_dates=2&start_date_from=2025-10-05&end_date_till=2025-10-12&search_type=package&page_limit=20&page_number=1&to_city=null&hotel_ids=9149847'
    },

]
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

export default function HotDealsSlide({slidesToShow,title}:{slidesToShow:number,title:string}) {
    const settings = {
        dots: true,
        infinite: false,
        speed: 500,
        slidesToShow: slidesToShow,
        slidesToScroll: slidesToShow,
        initialSlide: 0,
        nextArrow: <NextArrow />,
        prevArrow: <PrevArrow />,
        appendDots: (dots:number) => (
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
                    arrows:false
                }
            }

        ]
    };
    return (
        <div className={`${styles.contentFull} ${styles.contentFullHide}`}>
            <p className={styles.hotProductTitle}>{title}</p>
            <div className={styles.recomendlist}>
                    {MOCK_DATA.map((item, index) => (
                        <HotelBoxCard {...item} />
                    ))}
            </div>
            <div className={styles.recomendlistMob}>
                <Slider {...settings}>
                    {MOCK_DATA.map((item, index) => (
                        <HotelBoxCard {...item} />
                    ))}
                </Slider>
            </div>
        </div>
    );
}
