import React, {CSSProperties} from "react";
import Slider from "react-slick";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
import styles from './home.module.css'
import HotelBoxCard from "@/components/hotelBox/hotelBoxCard";
import Icon from "@/components/icons/Icon";
const MOCK_DATA= [
    {
        id:1,
        name:'Rixos Premium Seagate Resort & Spa',
        rate:4.5,
        city:'Египет',
        price:55723,
        review:196,
        image:'http://1hotels.com/sites/1hotels.com/files/styles/card/public/brandfolder/2j9vwq2tqz8qt8c52jgtwn6j/230814_1HotelMayfair1403_046_HiResh1280.png?h=c1c10988&itok=w2p01mMy'
    },
    {
        id:2,
        name:'Rixos Premium Seagate Resort & Spa',
        rate:4.5,
        city:'Египет',
        price:55723,
        review:196,
        image:'https://s1.at.atcdn.net/wp-content/uploads/2025/01/2025-openings-australia-1-800x600.png'
    },
    {
        id:2,
        name:'Rixos Premium Seagate Resort & Spa',
        rate:4.5,
        city:'Египет',
        price:55723,
        review:196,
        image:'https://www.timeoutjeddah.com/cloud/timeoutjeddah/2023/03/21/EcDaM5jl-St-regis-red-sea-resort-the-red-sea-2-800x600.png'
    },
    {
        id:2,
        name:'Rixos Premium Seagate Resort & Spa',
        rate:4.5,
        city:'Египет',
        price:55723,
        review:196,
        image:'https://www.timeoutjeddah.com/cloud/timeoutjeddah/2023/03/21/EcDaM5jl-St-regis-red-sea-resort-the-red-sea-2-800x600.png'
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
