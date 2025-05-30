import styles from '../searchPage.module.css';
import ItemSwitch from "@/components/UI/itemSwitch";
import {useState} from "react";
import Collapse from "@/components/UI/collapse";
import CheckboxGroup from "@/components/UI/checkboxGroup";
import RangeInput from "@/components/UI/rangeInput";



const OPTIONS = [
    { id: 1, name: 'Апарт-отель' },
    { id: 2, name: 'Апартаменты' },
    { id: 3, name: 'Вилла' },
    { id: 4, name: 'Коттедж' },
    { id: 5, name: 'Отель' },
    { id: 6, name: 'Хостел' },
];

const STARS = [
    { id: 1, name: '5 звёзд' },
    { id: 2, name: '4 звезды' },
    { id: 3, name: '3 звезды' },
    { id: 4, name: '2 звезды' },
    { id: 5, name: '1 звезда' },
]

const RATING = [
    { id: 1, name: 'Превосходно: 4.5+' },
    { id: 2, name: 'Отлично: 4+' },
    { id: 3, name: 'Хорошо: 3+' },
]
const FOR_FAMALE = [
    { id: 1, name: 'Детский бассейн' },
    { id: 2, name: 'Детский клуб' },
    { id: 3, name: 'Детский клуб' },
    { id: 4, name: 'Детская площадка' },
    { id: 5, name: 'Детская библиотека' },
]

const Filters = () => {
    const [fastAccepted, setFastAccepted] = useState(false);
    const [wifi,setWifi] = useState(false);
    const [selectedIds, setSelectedIds] = useState<(number | string)[]>([]);
    const [selectStart, setSelectStart] = useState<(number | string)[]>([]);
    const [selectRating, setSelectRating] = useState<(number | string)[]>([]);
    const [selectForFamale, setSelectForFamale] = useState<(number | string)[]>([]);
    const [price, setPrice] = useState([20,100]);
    const [km, setKm] = useState([20,60]);
    const [meter, setMeter] = useState([20,60]);
    return (
        <div className={styles.filters}>
            <ItemSwitch title={'Быстрое подтверждение'} setIsOn={setFastAccepted} isOn={fastAccepted} />
            <Collapse title={'Стоимость, ₽'} open={true}>
                <RangeInput
                    step={1}
                    min={0}
                    max={100}
                    values={price}
                    setValues={setPrice}
                    title={'Цена'}
                    symbol={'₽'}
                />
            </Collapse>
            <Collapse title={'Расстояние до аэропорта, км'} open={true}>
                <RangeInput
                    step={1}
                    min={0}
                    max={100}
                    values={km}
                    setValues={setKm}
                    title={'Цена'}
                    symbol={'км'}
                />
            </Collapse>
            <Collapse title={'Тип размещения'} open={true}>
                <CheckboxGroup
                    options={OPTIONS}
                    selected={selectedIds}
                    onChange={setSelectedIds}
                />
            </Collapse>
            <Collapse title={'Количество звёзд'} open={true}>
                <CheckboxGroup
                    options={STARS}
                    selected={selectStart}
                    onChange={setSelectStart}
                />
            </Collapse>
            <Collapse title={'Рейтинг'} open={true}>
                <CheckboxGroup
                    options={RATING}
                    selected={selectRating}
                    onChange={setSelectRating}
                />
            </Collapse>
            <Collapse title={'Расстояние до пляжа, м'} open={true}>
                <RangeInput
                    step={1}
                    min={0}
                    max={100}
                    values={meter}
                    setValues={setMeter}
                    title={'Цена'}
                    symbol={'м'}
                />
            </Collapse>
            <Collapse title={'Туроператор'}>
                <p>km</p>
            </Collapse>
            <ItemSwitch title={'Есть Wi-Fi'} setIsOn={setWifi} isOn={wifi} />
            <Collapse title={'Водные развлечения'}>
                <p>km</p>
            </Collapse>
            <Collapse title={'Удобства в отеле'}>
                <p>km</p>
            </Collapse>
            <Collapse title={'Для семей с детьми'} open={true}>
                <CheckboxGroup
                    options={FOR_FAMALE}
                    selected={selectForFamale}
                    onChange={setSelectForFamale}
                />
            </Collapse>

        </div>
    );
};

export default Filters;
