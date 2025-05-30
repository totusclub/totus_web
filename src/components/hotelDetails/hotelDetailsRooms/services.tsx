import styles from '../hotelDetails.module.css';
import TourAgents from "@/components/hotelDetails/hotelDetailsRooms/tourAgents";
import Tags from "@/components/UI/tags";
const MOCK_AGENTS = [
    {id:0,name:'Главное об отеле (9)'},
    {id:1,name:'Описание (4)'},
    {id:2,name:'Развлечения (9)'},
    {id:3,name:'На территории (17)'},
    {id:4,name:'Для детей (7)'},
]

const data = [
    {
        title:'Удобства',
        list:[
            {id: 1, name: 'Кондиционер'},
            {id: 2, name: 'Бар'},
            {id: 3, name: 'Фитнес'},
            {id: 4, name: 'Массаж'},
            {id: 5, name: 'Парковка'},
        ]
    },
    {
        title:'Водные услуги',
        list:[
            {id: 1, name: 'Бассейн'},
            {id: 2, name: 'Баня / сауна / хаммам'},
        ]
    },
    {
        title:'Детские услуги',
        list:[
            {id: 1, name: 'Няня'},
        ]
    } ,
    {
        title:'Интернет',
        list:[
            {id: 1, name: 'Бесплатный Wi-Fi'},
        ]
    }
];

const HotelDetailsServices = () => {
    return (
        <div className={styles.HotelDetailsServices}>
            <div className={styles.HotelDetailsServicesHead}>
                <p>Услуги и развлечения</p>
            </div>
            <div className={styles.HotelDetailsServicesBody}>
                <TourAgents agents={MOCK_AGENTS}/>
                {data.map((item,index) => (
                    <Tags key={index} item={item}/>
                ))}

            </div>
        </div>
    );
};

export default HotelDetailsServices;
