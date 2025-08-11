import styles from '../searchPage.module.css';
import Progress from "@/components/UI/progress";
import Tag from "@/components/UI/tag";
import {useEffect, useMemo, useState} from "react";
import Select from "@/components/UI/select";
import HotelCard from "@/components/hotelCard";
import TrackPrices from "@/components/UI/trackPrices";

interface FilterItem {
    id: number;
    name: string;
    active: boolean;

}
interface ResultListProps {
    tickets?:boolean
    loading:boolean
    data?:any
}

const ResultList = ({tickets,loading,data}:ResultListProps) => {

    const resultData = useMemo(() => {
        if(data){
            return data.hotels
        }else{
            return [];
        }
    },[data])


    const [filters, setFilters] = useState<FilterItem[]>([
        // { id: 1, name: 'Быстрое подтверждение', active: true },
        // { id: 2, name: '1-я линия', active: true },
        // { id: 3, name: 'Тип размещения', active: true },
        // { id: 4, name: 'от 4 звёзд', active: false },
        // { id: 5, name: 'Рейтинг: 4+', active: false },
        // { id: 6, name: 'Всё включено', active: false }
    ]);
    const [selected, setSelected] = useState(null);
    const [priceTrack, setPriceTrack] = useState(false);
    const options = [{value:'RUB',name:'По рекомендации'},{value:'USD',name:'Высокий рейтинг'},{value:'low',name:'Сначала дешёвые'},{value:'low',name:'Сначала дорогие'}];

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
            <Progress title={'Ищем подходящие туры'} loading={loading} />
            <div className={styles.resultListSelectedFilter}>
                {filters.length > 0 &&(
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
                    )}
                <div className={styles.resultListSorting}>
                    <p>Найдено {data?.hotels_count || 0} отеля</p>
                    {/*<Select*/}
                    {/*    type={'designMob'}*/}
                    {/*    options={options}*/}
                    {/*    value={selected}*/}
                    {/*    onChange={setSelected}*/}
                    {/*    label={'Сортировка'}*/}
                    {/*    placeholder="По рекомендации"/>*/}
                </div>
            </div>
            {/*{tickets ? (*/}
                <div className={styles.resultListItems}>
                    {resultData.map((item,index) => (
                        <>
                            <HotelCard key={item.id} request_id={data?.request_id} item={item} />
                            {index === 4 && (
                                <TrackPrices text={'Получайте автоматические оповещения при изменении цен.'} priceTrack={priceTrack} setPriceTrack={setPriceTrack}/>
                            )}
                        </>
                    ))}
                </div>
            {/*    ):(*/}
            {/*    <div className={styles.resultListItems}>*/}
            {/*        {Array.from({ length: 13 }).map((item,index) => (*/}
            {/*            <>*/}
            {/*                <HotelCard key={item.tour_id} item={item} />*/}
            {/*                {index === 4 && (*/}
            {/*                    <TrackPrices text={'Получайте автоматические оповещения при изменении цен.'} priceTrack={priceTrack} setPriceTrack={setPriceTrack}/>*/}
            {/*                )}*/}
            {/*            </>*/}
            {/*        ))}*/}
            {/*    </div>*/}
            {/*)}*/}

        </div>
    );
};

export default ResultList;
