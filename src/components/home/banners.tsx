import React, { useEffect, useState } from "react";
import styles from './home.module.css'
import { getHomeBanners, HomeBanner } from "@/api/homeBannersApi";


export default function HomeBanners() {
    const [banners, setBanners] = useState<HomeBanner[]>([]);

    useEffect(() => {
        getHomeBanners().then(setBanners).catch(() => setBanners([]));
    }, []);

    const getBanner = (position: number) => banners.find((b) => b.position === position);

    const renderItem = (position: number) => {
        const banner = getBanner(position);
        const style = banner?.image ? { backgroundImage: `url(${banner.image})` } : undefined;

        if (banner?.url) {
            return (
                <a
                    href={banner.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={styles.bannerItem}
                    style={style}
                />
            );
        }

        return <div className={styles.bannerItem} style={style} />;
    };

    return (
        <div className={'content'}>
            <div className={styles.banners}>
                {renderItem(1)}
                {renderItem(2)}
            </div>
        </div>
    );
}
