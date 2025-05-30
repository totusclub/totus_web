import styles from '../hotelDetails.module.css';
import TourAgents from "@/components/hotelDetails/hotelDetailsRooms/tourAgents";
import Icon from "@/components/icons/Icon";
import HotelDetailsPriceList from "@/components/hotelDetails/hotelDetailsRooms/priceList";
import SmallSlider from "@/components/UI/smallSlide";
import Image from "next/image";


const MOCK_AGENTS = [
    {id:0,name:'Все'},
    {id:1,name:'AnexTour'},
    {id:2,name:'Intourist'},
    {id:3,name:'Level.Travel'},
]
const MOCK_PRICES = [
    {
        id:1,
        title:'Без питания',
        description:'',
        items:[
            {
                id:1,
                date:'14 ночей, до 22.05',
                tourAgent:'Level.Travel',
                price:'1793276'
            },
            {
                id:2,
                date:'14 ночей, до 22.05',
                tourAgent:'Level.Travel',
                price:'1793276'
            }
        ]
    },
    {
        id:2,
        title:'Завтрак',
        description:'',
        items:[
            {
                id:1,
                date:'14 ночей, до 22.05',
                tourAgent:'Level.Travel',
                price:'1793276'
            },
            {
                id:2,
                date:'14 ночей, до 22.05',
                tourAgent:'Level.Travel',
                price:'1793276'
            }
        ]
    },
    {
        id:2,
        title:'Завтрак и обед или ужин',
        description:'Выбор типа питания зависит от отеля',
        items:[
            {
                id:1,
                date:'14 ночей, до 22.05',
                tourAgent:'Level.Travel',
                price:'1793276'
            },
            {
                id:2,
                date:'14 ночей, до 22.05',
                tourAgent:'Level.Travel',
                price:'1793276'
            }
        ]
    }
]

const HotelDetailsRoomItem = ({images}:any) => {

    return (
        <div className={styles.HotelDetailsRoomItem}>
            <div className={styles.HotelDetailsRoom}>
                {images.length > 1 ? (
                    <SmallSlider/>
                ) : (
                    <div className={styles.HotelDetailsRoomImage}>
                        <img alt={'imag'}
                             src={'https://www.staysomedays.com/wp-content/uploads/2021/12/hotel-grof-800x800.jpg'}/>
                    </div>
                )}

                <div className={styles.HotelDetailsRoomInforamation}>
                    <p>Двухместный Люкс Panoramic Дуплекс (Двуспальная Кровать)</p>
                    <div className={styles.HotelDetailsRoomOptions}>
                        <div className={styles.HotelDetailsRoomOption}>
                            <Icon name={'verify'}/>
                            <p>Без питания, завтрак, завтрак и обед или ужин</p>
                        </div>
                        <div className={styles.HotelDetailsRoomOption}>
                            <Icon name={'light'}/>
                            <p>Быстрое подтверждение</p>
                        </div>
                    </div>

                </div>
            </div>
            <TourAgents agents={MOCK_AGENTS}/>
            {MOCK_PRICES.map((item, index) => (
                <HotelDetailsPriceList key={index} item={item}/>
            ))}

        </div>
    );
};

export default HotelDetailsRoomItem;
