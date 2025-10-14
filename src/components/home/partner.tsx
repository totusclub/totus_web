import React, { useState } from "react";

import Slider from "react-slick";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
import styles from "./home.module.css";
import Icon from "@/components/icons/Icon";


export default function Partner() {
    const settings = {
        dots: true,
        infinite: false,
        speed: 500,
        slidesToShow: 1,
        slidesToScroll: 1,
        initialSlide: 0,
        responsive: [
            {
                breakpoint: 1026,
                settings: {
                    slidesToShow: 5,
                    slidesToScroll: 3,
                    infinite: true,
                    dots: false
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
                    slidesToShow: 2.7,
                    slidesToScroll: 3,
                    dots: false,
                    arrows:false
                }
            }

        ]
    };

    return (
        <div className={styles.contentFull}>
            <div className={styles.partnerList}>
                <div className={styles.partnerItem}>
                    <Icon name={'tezTour'} size={'100%'}/>
                </div>
                <div className={styles.partnerItem}>
                    <Icon name={'onexTour'} size={'100%'}/>
                </div>
                <div className={styles.partnerItem}>
                    <Icon name={'funAndSun'} size={'100%'}/>
                </div>
                <div className={styles.partnerItem}>
                    <Icon name={'biblioGlobus'} size={'100%'}/>
                </div>
                <div className={styles.partnerItem}>
                    <Icon name={'pegasTour'} size={'100%'}/>
                </div>
                <div className={styles.partnerItem}>
                    <Icon name={'coralTravel'} size={'100%'}/>
                </div>
            </div>
            <div className={styles.partnerListMob}>
                <Slider {...settings}>
                    <div className={styles.partnerItemMob}>
                        <div className={styles.partnerItem}>
                            <Icon name={'onexTour'} size={'100%'}/>
                        </div>
                    </div>
                    <div className={styles.partnerItemMob}>
                        <div className={styles.partnerItem}>
                            <Icon name={'funAndSun'} size={'100%'}/>
                        </div>
                    </div>
                    <div className={styles.partnerItemMob}>
                        <div className={styles.partnerItem}>
                            <Icon name={'biblioGlobus'} size={'100%'}/>
                        </div>
                    </div>
                    <div className={styles.partnerItemMob}>
                        <div className={styles.partnerItem}>
                            <Icon name={'pegasTour'} size={'100%'}/>
                        </div>
                    </div>
                    <div className={styles.partnerItemMob}>
                        <div className={styles.partnerItem}>
                            <Icon name={'coralTravel'} size={'100%'}/>
                        </div>
                    </div>
                </Slider>
            </div>

        </div>
    );
}
