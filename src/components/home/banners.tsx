import React, { useEffect, useState } from "react";
import styles from './home.module.css'
import { getHomeBanners, HomeBanner } from "@/api/homeBannersApi";

/** url("…") для CSS: кавычки и переводы строк в ссылке не ломают правило. */
function cssUrl(src: string): string {
    return `url("${src.replace(/["\\\n\r]/g, encodeURIComponent)}")`;
}

/**
 * Картинки баннера под тему сайта. Обе ссылки уходят в CSS-переменные, выбор делает CSS
 * (home.module.css: .bannerLight / [data-theme="dark"] .bannerDark) — без JS и без мигания
 * при переключении темы. Нет тёмной — в тёмной теме светлая; нет ни одной — стандартная картинка.
 */
function bannerTheme(banner?: HomeBanner): { className: string; style?: React.CSSProperties } {
    const light = banner?.image || '';
    const dark = banner?.image_dark || '';
    const classes = [styles.bannerItem];
    const style: Record<string, string> = {};
    if (light) {
        classes.push(styles.bannerLight);
        style['--banner-light'] = cssUrl(light);
    }
    if (dark) {
        classes.push(styles.bannerDark);
        style['--banner-dark'] = cssUrl(dark);
    }
    return { className: classes.join(' '), style: light || dark ? (style as React.CSSProperties) : undefined };
}

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
        const { className, style } = bannerTheme(banner);

        if (banner?.url) {
            return (
                <a
                    href={banner.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={className}
                    style={style}
                />
            );
        }

        return <div className={className} style={style} />;
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
