import React from "react";
import styles from './home.module.css'



export default function HomeBanners() {
    return (
        <div className={'content'}>
            <div className={styles.banners}>
                <div className={styles.bannerItem}></div>
                <div className={styles.bannerItem}></div>
            </div>
        </div>
    );
}
