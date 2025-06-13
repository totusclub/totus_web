import styles from '../searchPage.module.css';
import Tag from "@/components/UI/tag";
import { useState } from "react";
import Select from "@/components/UI/select";
import TrackPrices from "@/components/UI/trackPrices";
import TicketItem from "@/components/ticketItem";
import SelectedTour from "@/components/selectedTour";

interface FilterItem {
    id: number;
    name: string;
    active: boolean;
    packages: any;

}

const ResultTicketList = ({flights,packages}:any) => {
    const [filters, setFilters] = useState<FilterItem[]>([
        { id: 1, name: 'Регулярный', active: true },
        { id: 2, name: 'Без пересадок', active: false },
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

    console.log('packages',packages)

    return (
        <div className={styles.resultList}>
            <SelectedTour packages={packages}/>
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

                <div className={styles.resultListItems}>
                    {flights.map((item,index) => (
                        <>
                            <TicketItem price={packages.price} item={item} green={index===3}/>
                            {index === 4 && (
                                <TrackPrices text={'Получайте автоматические оповещения при изменении цен.'} priceTrack={priceTrack} setPriceTrack={setPriceTrack}/>
                            )}
                        </>
                    ))}
                </div>


        </div>
    );
};

export default ResultTicketList;
