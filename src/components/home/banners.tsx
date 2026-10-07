import React, { useEffect, useState } from "react";
import styles from './home.module.css'
import { getHomeBanners, HomeBanner } from "@/api/homeBannersApi";


/** initialBanners — с сервера (главная, getServerSideProps); null — запросить в браузере, как раньше. */
export default function HomeBanners({ initialBanners = null }: { initialBanners?: HomeBanner[] | null }) {
    const [banners, setBanners] = useState<HomeBanner[]>(initialBanners ?? []);

    useEffect(() => {
        if (initialBanners) return;
        getHomeBanners().then(setBanners).catch(() => setBanners([]));
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

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
