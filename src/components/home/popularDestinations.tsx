import React from "react";
import Slider from "react-slick";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
import styles from './home.module.css'
import Icon from "@/components/icons/Icon";

const MOCK_DATA= [
    {
        id:1,
        name:'Египет',
        image:'/images/egypt.png'
    },
    {
        id:2,
        name:'Турция',
        image:'/images/turky.png'
    },
    {
        id:2,
        name:'Россия',
        image:'/images/russon.png'
    },
    {
        id:2,
        name:'Мальдивы',
        image:'/images/maldiv.png'
    },
    {
        id:2,
        name:'ОАЭ',
        image:'/images/oae.png'
    },
    {
        id:2,
        name:'Индонезия',
        image:'/images/indonezia.png'
    },
]


export default function PopularDestinations() {
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
                    slidesToScroll: 3,
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
                                    <p>{item.name}     <Icon name={'next'} /></p>
                                </div>
                            </div>
                        </div>
                    ))}
                </Slider>
            </div>
        </div>
    );
}
