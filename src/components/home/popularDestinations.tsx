import React from "react";
import Slider from "react-slick";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
import styles from './home.module.css'
import Icon from "@/components/icons/Icon";
import {router} from "next/client";
import {useRouter} from "next/router";

const MOCK_DATA= [
    {
        id:1,
        name:'Египет',
        image:'/images/egypt.png',
        url:`/search?from_city=Moscow&from_country=RU&to_country=EG&adults=2&start_date=2025-08-19&nights=7..9&flex_dates=2&start_date_from=2025-08-19&end_date_till=2025-08-26&search_type=package`,
    },
    {
        id:2,
        name:'Турция',
        image:'/images/turky.png',
        url:'/search?from_city=Moscow&from_country=RU&to_country=TR&adults=2&start_date=2025-08-19&nights=7..9&flex_dates=2&start_date_from=2025-08-19&end_date_till=2025-08-26&search_type=package'
    },
    {
        id:2,
        name:'Россия',
        image:'/images/russon.png',
        url:'/search?from_city=Moscow&from_country=RU&to_country=RU&adults=2&start_date=2025-08-19&nights=7..9&flex_dates=2&start_date_from=2025-08-19&end_date_till=2025-08-26&search_type=package'
    },
    {
        id:2,
        name:'Мальдивы',
        image:'/images/maldiv.png',
        url:'/search?from_city=Moscow&from_country=RU&to_country=MV&adults=2&start_date=2025-08-19&nights=7..9&flex_dates=2&start_date_from=2025-08-19&end_date_till=2025-08-26&search_type=package',
    },
    {
        id:2,
        name:'ОАЭ',
        image:'/images/oae.png',
        url:'/search?from_city=Moscow&from_country=RU&to_country=AE&adults=2&start_date=2025-08-19&nights=7..9&flex_dates=2&start_date_from=2025-08-19&end_date_till=2025-08-26&search_type=package',
    },
    {
        id:2,
        name:'Индонезия',
        image:'/images/indonezia.png',
        url:'/search?from_city=Moscow&from_country=RU&to_country=ID&adults=2&start_date=2025-08-19&nights=7..9&flex_dates=2&start_date_from=2025-08-19&end_date_till=2025-08-26&search_type=package',
    },
]


export default function PopularDestinations() {
    const router = useRouter();
    const settings = {
        dots: true,
        infinite: false,
        speed: 500,
        slidesToShow: 1,
        slidesToScroll: 1,
        initialSlide: 0,
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
        <div className={styles.contentFull}>
            <p className={styles.hotProductTitle}>Популярные направления</p>
            <div className={styles.recomendDeslist}>
                {MOCK_DATA.map((item, index) => (
                    <div key={index} className={styles.recomendDeslistItem} style={{backgroundImage: `url(${item.image})`}}>
                        <div className={styles.recomendDeslistItemInfo}>
                            <p>{item.name}     <Icon name={'next'} /></p>
                        </div>
                    </div>
                ))}
            </div>

            <div className={styles.recomendDeslistMob}>
                <Slider {...settings}>
                    {MOCK_DATA.map((item, index) => (
                        <div key={index}>
                            <div  className={styles.recomendDeslistItem} style={{backgroundImage: `url(${item.image})`}}>
                                <div className={styles.recomendDeslistItemInfo}>
                                    <a href={item?.url}>{item.name}     <Icon name={'next'} /></a>
                                </div>
                            </div>
                        </div>
                    ))}
                </Slider>
            </div>
        </div>
    );
}
