import React, {CSSProperties} from "react";
import Slider from "react-slick";
import "slick-carousel/slick/slick.css";
import styles from './home.module.css'
import Icon from "@/components/icons/Icon";
import Rating from "@/components/UI/rating";
import { useIconColor } from "@/hooks/useTheme";
const MOCK_DATA= [
    {
        id:1,
        name:'Дмитрий Иванов',
        text:'Здравствуйте, дорогие друзья! Я уже давно отказалась от услуг турагентств и сама заказываю отели для отды...',
        rate:5,
    },
    {
        id:2,
        name:'Светлана Трофимова',
        text:'Здравствуйте, дорогие друзья! Я уже давно отказалась от услуг турагентств и сама заказываю отели для отды...',
        rate:5,
    },
    {
        id:3,
        name:'Екатерина Романова',
        text:'Здравствуйте, дорогие друзья! Я уже давно отказалась от услуг турагентств и сама заказываю отели для отды...',
        rate:5,
    },
    {
        id:4,
        name:'Екатерина Романова',
        text:'Здравствуйте, дорогие друзья! Я уже давно отказалась от услуг турагентств и сама заказываю отели для отды...',
        rate:5,
    },
]

interface ArrowProps {
    onClick?: () => void;
    className?: string;
    style?: CSSProperties;
}

const NextArrow = ({ onClick }: ArrowProps) => {
    const iconColor = useIconColor();
    return (
        <div className={styles.nextArrowRec} onClick={onClick}>
            <Icon name="rightArrow" size={24} color={iconColor} />
        </div>
    );
};

const PrevArrow = ({ onClick }: ArrowProps) => {
    const iconColor = useIconColor();
    return (
        <div className={styles.prevArrowRec} onClick={onClick}>
            <Icon name="leftArrow" size={24} color={iconColor} />
        </div>
    );
};

export default function TourRecomend({slidesToShow,title}:{slidesToShow:number,title:string}) {
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
                    slidesToShow: 1,
                    slidesToScroll: 1
                }
            }
        ]
    };
    return (
        <div className={'content'}>
            <p className={styles.hotProductTitle}>{title}</p>
            <Slider {...settings}>
                {MOCK_DATA.map((item, index) => (
                    <div className={styles.itemHotProduct} key={index}>
                        <div className={styles.itemProduct}>
                            <div className={styles.tourItem}>
                                <div className={styles.tourItemBadge}>
                                    <Icon name={'check'} size={12} color="#000" />
                                    <p>Куплен тур</p>
                                </div>
                                <p className={styles.tourItemTitle}>{item.name}</p>
                                <p className={styles.tourItemText}>{item.text}</p>
                                <Rating/>
                            </div>
                        </div>
                    </div>
                ))}
            </Slider>
        </div>
    );
}
