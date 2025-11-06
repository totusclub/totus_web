import { useEffect, useMemo, useState } from "react";
import styles from '../hotelDetails.module.css';
import VerticalSlider from "@/components/UI/verticalSlide";
import Button from "@/components/UI/button";
import Icon from "@/components/icons/Icon";
import TrackPrices from "@/components/UI/trackPrices";
import { router } from "next/client";
import { createPackage } from "@/api/levelTravelApi";
import { useRouter } from "next/router";


const HotelDetailsInfo = ({ images, rooms, panding }: any) => {
    const router = useRouter();
    const [priceTrack, setPriceTrack] = useState<boolean>(false);
    const [fisrtDate, setFisrtDate] = useState(null);
    const [loading, setLoading] = useState(false);


    const handleBook = async (id: any) => {
        setLoading(true)
        const res = await createPackage({ request_id: router.query.request_id, tour_id: id })
        setLoading(false)
        router.push(`/tickets?package=${res.package.id}`);
    };




    useEffect(() => {
        const closestOffer = (() => {
            let earliest = null;
            rooms?.forEach(room => {
                const offers = room?.offers || {};
                Object.values(offers).forEach(offerList => {
                    offerList.forEach(item => {
                        const date = item?.start_date;
                        if (!date) return;

                        const itemDate = new Date(date);
                        if (
                            !earliest ||
                            itemDate < new Date(earliest.start_date)
                        ) {
                            earliest = item;
                        }
                    });
                });
            });

            return earliest;
        })();
        setFisrtDate(closestOffer)
        // console.log('Closest (first date) offer:', closestOffer);
    }, [rooms])

    const formatDate = useMemo(() => {
        if (fisrtDate?.start_date) {
            const date = new Date(fisrtDate?.start_date);

            const formatter = new Intl.DateTimeFormat('ru-RU', {
                day: 'numeric',
                month: 'long'
            });

            const formatted = formatter.format(date);

            return `с ${formatted}`;
        }
    }, [fisrtDate?.start_date])

    if (!panding) {
        return (
            <div className={'content'}>
                <div className={styles.HotelDetailsInfoRow}>
                    <VerticalSlider loading={panding} images={images} />
                    <div className={styles.HotelDetailsInfo}>
                        <div className={styles.HotelDetailsInfoPrice}>
                            <p className={styles.HotelDetailsInfoPriceText}>от {fisrtDate?.price.toString()?.replace(/\B(?=(\d{3})+(?!\d))/g, '\u202F')}₽</p>
                            <div className={styles.HotelDetailsInfoDate}>
                                <p className={styles.HotelDetailsInfoDateTitle}>Цена за тур с перелётом</p>
                                <p className={styles.HotelDetailsInfoDateText}>{formatDate}, {fisrtDate?.nights_count} ночей</p>
                            </div>
                            <Button loading={loading} onClick={() => handleBook(fisrtDate?.id)} title={'Выбрать номер'}
                                full={true} />
                        </div>
                        <div className={styles.HotelDetailsInfoMessage}>
                            <div className={styles.HotelDetailsInfoMessageIcon}>
                                <Icon name={'travel'} size={61} />
                            </div>
                            <p className={styles.HotelDetailsInfoMessageText}>Это место предлагает уникальный опыт, сочетая
                                роскошь и природу. Мы здесь, чтобы помочь вам осуществить вашу мечту о путешествии!</p>
                        </div>
                        <TrackPrices text={'Автоматические оповещения \n при изменении цен.'} priceTrack={priceTrack}
                            setPriceTrack={setPriceTrack} />
                    </div>
                </div>
            </div>

        );
    } else {
        return (
            <div className={'content'}>
                <div className={styles.HotelDetailsInfoRow}>
                    <VerticalSlider loading={panding} images={images} />
                    <div className={styles.HotelDetailsInfo}>
                        <div className={styles.HotelDetailsInfoPrice}>
                            <div className={styles.animationTextlazy1}></div>
                            <div className={styles.animationTextlazy2}></div>
                            <div className={styles.animationButtonLazy}></div>
                        </div>
                    </div>
                </div>
            </div>
        )
    }

};

export default HotelDetailsInfo;
