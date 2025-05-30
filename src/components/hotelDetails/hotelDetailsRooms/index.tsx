import styles from '../hotelDetails.module.css';
import DatesPrice from "@/components/hotelDetails/hotelDetailsRooms/datesPrice";
import HotelDetailsRoomItem from "@/components/hotelDetails/hotelDetailsRooms/roomItem";
import Icon from "@/components/icons/Icon";
import Button from "@/components/UI/button";
import {router} from "next/client";

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

const HotelDetailsRooms = () => {
    return (
        <div className={styles.HotelDetailsRoomsRow}>
            <div className={styles.HotelDetailsRooms}>
                <div className={styles.HotelDetailsRoomsHead}>
                    <p>Выберите номер</p>
                </div>
                <DatesPrice dates={MOCK_DATES}/>
                <HotelDetailsRoomItem images={[1,2]}/>
                <HotelDetailsRoomItem images={[1]}/>
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
