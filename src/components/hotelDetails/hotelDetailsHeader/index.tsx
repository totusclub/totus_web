import styles from '../hotelDetails.module.css';
import Icon from "@/components/icons/Icon";
// import Icon from "@/components/icons/Icon";
// import {useEffect, useRef, useState} from "react";
// import RangeStep from "@/components/UI/range";
// import SwitchToggle from "@/components/UI/switch";






const HotelDetailsHeader = ({info}:any) => {


    return (
        <div className={styles.HotelDetailsHeader}>
            <div className={styles.HotelDetailsHeaderRow}>
                <div className={styles.HotelDetailsHeaderCity}>
                    <Icon name={'hotel'} size={14}/>
                    <p>{info?.stars}  <Icon name={'star'} size={14}/></p>
                </div>
                <div className={styles.HotelDetailsHeaderRate}>
                    <p>{info?.rating}</p>
                </div>
            </div>
            <p className={styles.HotelDetailsHeaderName}>{info?.name}</p>
            <p className={styles.HotelDetailsHeaderAddress}>{info?.address}</p>

        </div>
    );
};

export default HotelDetailsHeader;
