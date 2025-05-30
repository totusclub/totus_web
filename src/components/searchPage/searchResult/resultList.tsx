import styles from '../searchPage.module.css';
import Progress from "@/components/UI/progress";
import Tag from "@/components/UI/tag";
import { useState } from "react";
import Select from "@/components/UI/select";
import HotelCard from "@/components/hotelCard";
import TrackPrices from "@/components/UI/trackPrices";

interface FilterItem {
    id: number;
    name: string;
    active: boolean;

}

const MOCK_DATA = [
    {
        id:1,
        name:'Rixos Premium Seagate',
        rate:5,
        city:'Шарм-эль-Шейх, Отель 5',
        price:'150 320',
        tags:['1-я линия','Песок','550 м до пляжа','9 км до аэропорта','Бесплатный Wi-Fi'],
        date:'8 мая',
        night:'7',
        image:'https://s1.at.atcdn.net/wp-content/uploads/2025/01/2025-openings-australia-1-800x600.png'
    },
]
interface ResultListProps {
    tickets?:boolean
}

const ResultList = ({tickets}:ResultListProps) => {
    const [filters, setFilters] = useState<FilterItem[]>([
        { id: 1, name: 'Быстрое подтверждение', active: true },
        { id: 2, name: '1-я линия', active: true },
        { id: 3, name: 'Тип размещения', active: true },
        { id: 4, name: 'от 4 звёзд', active: false },
        { id: 5, name: 'Рейтинг: 4+', active: false },
        { id: 6, name: 'Всё включено', active: false }
    ]);
    const [selected, setSelected] = useState(null);
    const [priceTrack, setPriceTrack] = useState(false);
    const options = [{value:'RUB',name:'Российский рубль (₽)'},{value:'USD',name:'Доллар США ($)'}];

    const handleFilterToggle = (id: number) => {
        setFilters(prev =>
            prev.map(filter =>
                filter.id === id ? { ...filter, active: !filter.active } : filter
            )
        );
    };

    const removeAll =()=>{

    }

    return (
        <div className={styles.resultList}>
            <Progress title={'Ищем подходящие туры'} loading={true} />
            <div className={styles.resultListSelectedFilter}>
                <div className={styles.selectedFiltersList}>
                    {filters.map((item) => (
                        <Tag
                            key={item.id}
                            title={item.name}
                            active={item.active}
                            onClick={() => handleFilterToggle(item.id)}
                        />
                    ))}
                    <Tag
                        key={12345}
                        title={'Очистить все'}
                        active={false}
                        onClick={() => removeAll()}
                        icon={'trash'}
                    />
                </div>
                <div className={styles.resultListSorting}>
                    <p>Найдено 404 отеля</p>
                    <Select
                        options={options}
                        value={selected}
                        onChange={setSelected}
                        label={'Сортировка'}
                        placeholder="По рекомендации"/>
                </div>
            </div>
            {tickets ? (
                <div className={styles.resultListItems}>
                    {Array.from({ length: 13 }).map((item,index) => (
                        <>
                            <HotelCard key={MOCK_DATA[0].id} item={MOCK_DATA[0]} />
                            {index === 4 && (
                                <TrackPrices text={'Получайте автоматические оповещения при изменении цен.'} priceTrack={priceTrack} setPriceTrack={setPriceTrack}/>
                            )}
                        </>
                    ))}
                </div>
                ):(
                <div className={styles.resultListItems}>
                    {Array.from({ length: 13 }).map((item,index) => (
                        <>
                            <HotelCard key={MOCK_DATA[0].id} item={MOCK_DATA[0]} />
                            {index === 4 && (
                                <TrackPrices text={'Получайте автоматические оповещения при изменении цен.'} priceTrack={priceTrack} setPriceTrack={setPriceTrack}/>
                            )}
                        </>
                    ))}
                </div>
            )}

        </div>
    );
};

export default ResultList;
