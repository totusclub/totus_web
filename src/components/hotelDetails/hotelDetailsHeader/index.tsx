import styles from '../hotelDetails.module.css';
import Icon from "@/components/icons/Icon";
// import Icon from "@/components/icons/Icon";
// import {useEffect, useRef, useState} from "react";
// import RangeStep from "@/components/UI/range";
// import SwitchToggle from "@/components/UI/switch";






const HotelDetailsHeader = () => {


    return (
        <div className={styles.HotelDetailsHeader}>
            <div className={styles.HotelDetailsHeaderRow}>
                <div className={styles.HotelDetailsHeaderCity}>
                    <Icon name={'hotel'} size={14}/>
                    <p>{'Шарм-эль-Шейх, Отель 5*'}</p>
                </div>
                <div className={styles.HotelDetailsHeaderRate}>
                    <Icon name={'star'} size={14}/>
                    <p>{'5'} ･ Превосходно</p>
                </div>
            </div>
            <p className={styles.HotelDetailsHeaderName}>Eastern Mangroves Hotel & Spa By Anantara</p>
            <p className={styles.HotelDetailsHeaderAddress}>P.O. Box 128555 Sheikh Zayed Street Abu Dhabi, 128555 Абу-Даби, ОАЭ</p>

        </div>
    );
};

export default HotelDetailsHeader;
