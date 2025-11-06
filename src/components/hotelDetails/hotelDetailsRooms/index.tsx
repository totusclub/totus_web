import styles from '../hotelDetails.module.css';
import DatesPrice from "@/components/hotelDetails/hotelDetailsRooms/datesPrice";
import HotelDetailsRoomItem from "@/components/hotelDetails/hotelDetailsRooms/roomItem";
import Icon from "@/components/icons/Icon";
import Button from "@/components/UI/button";
import { router } from "next/client";
import { useEffect, useMemo, useState } from "react";
import { createPackage } from "@/api/levelTravelApi";
import { useRouter } from "next/router";

const HotelDetailsRooms = ({ rooms }: any) => {
    const router = useRouter();
    const [selectedDate, setSelectedDate] = useState<Date | null>(null);
    const [fisrtDate, setFisrtDate] = useState(null);
    const [loading, setLoading] = useState(false);
    const pricesList = useMemo(() => {
        if (!rooms) return;

        const grouped = rooms.reduce((acc, room) => {
            const offers = room?.offers || {};

            Object.values(offers).forEach(offerList => {
                offerList.forEach(({ start_date, analytics_price }) => {
                    if (
                        !acc[start_date] ||
                        analytics_price < acc[start_date]
                    ) {
                        acc[start_date] = analytics_price;
                    }
                });
            });

            return acc;
        }, {});

        // Сортировка по дате
        const sorted = Object.entries(grouped)
            .sort(([dateA], [dateB]) => new Date(dateA) - new Date(dateB))
            .reduce((acc, [date, price]) => {
                acc[date] = price;
                return acc;
            }, {});

        // console.log("Sorted by start_date with min prices:", sorted);
        return sorted
    }, [rooms]);


    const roomTypeName = {
        BB: 'Завтрак',
        RO: 'Без питания',
        AI: 'Всё включено',
        UAI: 'Ультра всё включено',
        HB: 'Завтрак и ужин',
        FB: 'Завтрак, обед, ужин',
        HBD: 'Завтрак и ужин',
        AI24: 'Всё включено 24 часа',
        DNR: 'Ужин',
        AIL: 'Всё включено с ограничениями',
        'FB+': 'Завтрак, обед, ужин +',
        'HB+': 'Завтрак и ужин +',
        HBL: 'Завтрак и обед'
    }



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
    }, [rooms])


    const handleBook = async (id: any) => {
        setLoading(true)
        const res = await createPackage({ request_id: router.query.request_id, tour_id: id })
        // console.log('handleBook', res.package.id)
        setLoading(false)
        router.push(`/tickets?package=${res.package.id}`);
    };

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

    return (
        <div className={'content'}>
            <div className={styles.HotelDetailsRoomsRow}>
                <div className={styles.HotelDetailsRooms}>
                    <div className={styles.HotelDetailsRoomsHead}>
                        <p>Выберите номер</p>
                    </div>
                    <DatesPrice dates={pricesList} selectedDate={selectedDate} setSelectedDate={setSelectedDate} />
                    {rooms.map((r, i) => (
                        <HotelDetailsRoomItem item={r} selectedDate={selectedDate} />
                    ))}

                </div>
                <div className={styles.HotelDetailsMap}>
                    <div className={styles.HotelDetailsMapBox}>
                        <div className={styles.HotelDetailsMapBoxTitle}>
                            <Icon name={'location'} size={16} />
                            <p> Jumeirah Beach Road, Дубай, ОАЭ</p>
                        </div>
                        <div className={styles.map}>
                            {/*<Map defaultState={{ center: [55.75, 37.57], zoom: 9 }} />*/}
                        </div>
                    </div>
                    <div className={styles.HotelDetailsInfoPrice}>
                        <p className={styles.HotelDetailsInfoPriceText}>от {fisrtDate?.price.toString()?.replace(/\B(?=(\d{3})+(?!\d))/g, '\u202F')}₽</p>
                        <div className={styles.HotelDetailsInfoDate}>
                            <p className={styles.HotelDetailsInfoDateTitle}>Цена за тур с перелётом</p>
                            <p className={styles.HotelDetailsInfoDateText}>{formatDate}, {fisrtDate?.nights_count} ночей</p>
                        </div>
                        <Button loading={loading} onClick={() => handleBook(fisrtDate?.id)} title={'Выбрать номер'}
                            full={true} />
                    </div>

                </div>
            </div>
        </div>
    );
};

export default HotelDetailsRooms;
