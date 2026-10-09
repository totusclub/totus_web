import React from "react";
import styles from './home.module.css'
import HotelBoxCard from "@/components/hotelBox/hotelBoxCard";
import { useRouter } from "next/router";
import { buildHotelDetailsDeepLinkQuery } from "@/utils/hotelDetailsUtils";
import { useNearViewport } from "@/hooks/useNearViewport";
import { useAfterPageLoad } from "@/hooks/useAfterPageLoad";

interface HotelItem {
    id: number | string;
    name?: string;
    rate?: number;
    city?: string;
    price?: number;
    review?: number;
    image?: string;
    url?: string;
}
// slidesToShow — прежний проп карусели; больше не используется, оставлен, чтобы не менять вызов на главной.
export default function HotDealsSlide({ title, recomendHotels }: { slidesToShow: number, title: string, recomendHotels?: HotelItem[] | null }) {
    const router = useRouter();
    // Фото отелей грузим, когда блок рядом с экраном (PageSpeed: не мешать главной картинке).
    // На телефоне блок виден уже на первом экране — поэтому ещё и только после загрузки страницы:
    // 3 фото по ~110 КБ больше не делят канал с картинкой hero (LCP).
    const [desktopListRef, desktopListVisible] = useNearViewport<HTMLDivElement>();
    const [mobileListRef, mobileListVisible] = useNearViewport<HTMLDivElement>();
    const pageLoaded = useAfterPageLoad();

    const handlePressHotel = React.useCallback(
        (hotelId: number | string) => {
            if (!hotelId) {
                return;
            }

            router.push({
                pathname: '/hotel-details',
                query: buildHotelDetailsDeepLinkQuery(hotelId),
            }, undefined, { shallow: false });
        },
        [router]
    );

    return (
        <div className={`${styles.contentFull} ${styles.contentFullHide}`}>
            <p className={styles.hotProductTitle}>{title}</p>
            <div className={styles.recomendlist} ref={desktopListRef}>
                {recomendHotels?.map((item: HotelItem, index: number) => (
                    <HotelBoxCard
                        key={item.id ?? index}
                        id={typeof item.id === 'number' ? item.id : Number(item.id) || 0}
                        name={item.name || ''}
                        rate={item.rate || 0}
                        city={item.city || ''}
                        price={item.price || 0}
                        review={item.review || 0}
                        image={item.image || ''}
                        showImage={desktopListVisible && pageLoaded}
                        url=""
                        onClick={() => handlePressHotel(item.id)}
                    />
                ))}
            </div>
            {/* Телефон и планшет (до 1024 px): обычная горизонтальная прокрутка браузера с привязкой
                к карточке — плавно и с инерцией (react-slick листал рывками). Стили — .mobScroller. */}
            <div className={styles.recomendlistMob} ref={mobileListRef}>
                <div className={styles.mobScroller}>
                    {recomendHotels?.map((item: HotelItem, index: number) => (
                        <div key={item.id ?? index} className={styles.mobScrollerItem}>
                            <HotelBoxCard
                                id={typeof item.id === 'number' ? item.id : Number(item.id) || 0}
                                name={item.name || ''}
                                rate={item.rate || 0}
                                city={item.city || ''}
                                price={item.price || 0}
                                review={item.review || 0}
                                image={item.image || ''}
                                showImage={mobileListVisible && pageLoaded}
                                url=""
                                onClick={() => handlePressHotel(item.id)}
                            />
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
