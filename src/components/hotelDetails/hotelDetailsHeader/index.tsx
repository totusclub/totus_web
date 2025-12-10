import styles from '../hotelDetails.module.css';
import Icon from "@/components/icons/Icon";
import { useTheme } from "@/hooks/useTheme";
// import Icon from "@/components/icons/Icon";
// import {useEffect, useRef, useState} from "react";
// import RangeStep from "@/components/UI/range";
// import SwitchToggle from "@/components/UI/switch";






const HotelDetailsHeader = ({ info, loading }: any) => {
    const { theme, mounted } = useTheme();

    // Use safe default during SSR to prevent hydration mismatch
    const iconColor = mounted ? (theme === 'dark' ? '#fff' : '#000') : '#000';

    if (!loading) {
        return (
            <div className={'content'}>
                <div className={styles.HotelDetailsHeader}>
                    <div className={styles.HotelDetailsHeaderRow}>
                        <div className={styles.hotelStart}>
                            <Icon name={'star'} size={18}
                                color={info?.stars >= 1 ? 'var(--core_Orange)' : 'var(--bgSecondary)'} />
                            <Icon name={'star'} size={18}
                                color={info?.stars >= 2 ? 'var(--core_Orange)' : 'var(--bgSecondary)'} />
                            <Icon name={'star'} size={18}
                                color={info?.stars >= 3 ? 'var(--core_Orange)' : 'var(--bgSecondary)'} />
                            <Icon name={'star'} size={18}
                                color={info?.stars >= 4 ? 'var(--core_Orange)' : 'var(--bgSecondary)'} />
                            <Icon name={'star'} size={18}
                                color={info?.stars >= 5 ? 'var(--core_Orange)' : 'var(--bgSecondary)'} />
                        </div>
                        {/*<div className={styles.HotelDetailsHeaderCity}>*/}
                        {/*    <Icon name={'hotel'} size={14}/>*/}
                        {/*    <p>{info?.stars}  <Icon name={'star'} size={14}/></p>*/}
                        {/*</div>*/}
                        {/*<div className={styles.HotelDetailsHeaderRate}>*/}
                        {/*    <p>{info?.rating}</p>*/}
                        {/*</div>*/}
                    </div>
                    <p className={styles.HotelDetailsHeaderName}>{info?.name}</p>
                    <div className={styles.hotelCardImageInfo}>
                        {info?.rating > 0 && (
                            <p>{info?.rating}</p>
                        )}
                        <p><Icon name={'message'} size={14}
                            color={iconColor} /> {info?.reviews_count > 0 ? `${info?.reviews_count} отзывов` : 'нет отзывов'}
                        </p>
                    </div>
                    <p className={styles.HotelDetailsHeaderAddress}>{info?.address}</p>
                </div>
            </div>
        );
    } else {
        return (
            <div className={'content'}>
                <div className={styles.HotelDetailsHeader}>
                    <div className={styles.hotelStart}>
                        <Icon name={'star'} size={18} color={'#dcdcdc'} />
                        <Icon name={'star'} size={18} color={'#dcdcdc'} />
                        <Icon name={'star'} size={18} color={'#dcdcdc'} />
                        <Icon name={'star'} size={18} color={'#dcdcdc'} />
                        <Icon name={'star'} size={18} color={'#dcdcdc'} />
                    </div>
                    <div className={styles.animationTextlazy}></div>
                    <div className={styles.animationTextlazy2}></div>
                </div>
            </div>
        );
    }

};

export default HotelDetailsHeader;
