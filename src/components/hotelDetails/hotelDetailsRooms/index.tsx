import styles from '../hotelDetails.module.css';
import DatesPrice from "@/components/hotelDetails/hotelDetailsRooms/datesPrice";
import HotelDetailsRoomItem from "@/components/hotelDetails/hotelDetailsRooms/roomItem";
import Icon from "@/components/icons/Icon";
import Button from "@/components/UI/button";
import {router} from "next/client";
import {useEffect, useMemo, useState} from "react";

const MOCK_DATES = [
    {
        date:new Date('2025-05-08'),
        price:1234
    },
    {
        date:new Date('2025-05-09'),
        price:1234
    },
    {
        date:new Date('2025-05-10'),
        price:1234
    },
    {
        date:new Date('2025-05-11'),
        price:1234
    },
    {
        date:new Date('2025-05-12'),
        price:1234
    }
]



const HotelDetailsRooms = ({rooms}:any) => {
    const [selectedDate, setSelectedDate] = useState<Date | null>(null);
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

        console.log("Sorted by start_date with min prices:", sorted);
        return sorted
    }, [rooms]);


    const roomTypeName= {
        BB:'Завтрак',
        RO:'Без питания',
        AI:'Всё включено',
        UAI:'Ультра всё включено',
        HB:'Завтрак и ужин',
        FB:'Завтрак, обед, ужин',
        HBD:'Завтрак и ужин',
        AI24:'Всё включено 24 часа',
        DNR:'Ужин',
        AIL:'Всё включено с ограничениями',
        'FB+':'Завтрак, обед, ужин +',
        'HB+':'Завтрак и ужин +',
        HBL:'Завтрак и обед'
    }




    return (
        <div className={styles.HotelDetailsRoomsRow}>
            <div className={styles.HotelDetailsRooms}>
                <div className={styles.HotelDetailsRoomsHead}>
                    <p>Выберите номер</p>
                </div>
                <DatesPrice dates={pricesList} selectedDate={selectedDate} setSelectedDate={setSelectedDate}/>
                {rooms.map((r,i)=>(
                    <HotelDetailsRoomItem item={r} selectedDate={selectedDate}/>
                ))}

            </div>
            <div className={styles.HotelDetailsMap}>
                <div className={styles.HotelDetailsMapBox}>
                    <div className={styles.HotelDetailsMapBoxTitle}>
                        <Icon name={'location'} size={16}/>
                        <p> Jumeirah Beach Road, Дубай, ОАЭ</p>
                    </div>
                    <div className={styles.map}>
                        {/*<Map defaultState={{ center: [55.75, 37.57], zoom: 9 }} />*/}
                    </div>
                </div>
                <div className={styles.HotelDetailsInfoPrice}>
                    <p className={styles.HotelDetailsInfoPriceText}>от 1 396 810 ₽</p>
                    <div className={styles.HotelDetailsInfoDate}>
                        <p className={styles.HotelDetailsInfoDateTitle}>Цена за тур с перелётом</p>
                        <p className={styles.HotelDetailsInfoDateText}>с 8 мая, 7 ночей, 1 взрослый</p>
                    </div>
                    <Button onClick={()=> router.push("/tickets")} title={'Выбрать номер'} full={true}/>
                </div>

            </div>
        </div>
    );
};

export default HotelDetailsRooms;
