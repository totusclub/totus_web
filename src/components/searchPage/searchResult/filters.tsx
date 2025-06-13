import styles from '../searchPage.module.css';
import ItemSwitch from "@/components/UI/itemSwitch";
import {useEffect, useMemo, useState} from "react";
import Collapse from "@/components/UI/collapse";
import CheckboxGroup from "@/components/UI/checkboxGroup";
import RangeInput from "@/components/UI/rangeInput";
import {searchFilters} from "@/store/slices/searchSlice";
import {useDispatch} from "react-redux";





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

const Filters = ({selectedFilters,allFilters,statistics}:any) => {
    const dispatch = useDispatch();
    const [price, setPrice] = useState([20,100]);
    const [km, setKm] = useState([20,60]);
    const [meter, setMeter] = useState([20,60]);
    const [filters,setFilters] = useState({
        filter_instant_confirm:false
    })



   useEffect(()=>{
       if(allFilters){
           setFilters({
               ...filters,
               filter_price_min:allFilters?.prices?.min || 0,
               filter_price_max:allFilters?.prices?.max || 0
           })

       }
       if(statistics){
           setPrice([statistics.shown_min_price || 0,statistics?.shown_max_price || 0]);
       }

   },[allFilters,statistics])




    const onChangeFilters = (key:string,value:string | boolean | number[])=>{
        if(key === 'price'){
            console.log(key,value)
            let priceUpdate = {
                ...filters,
                ...selectedFilters,
                filter_price_min:value[0],
                filter_price_max:value[1]
            }
            setFilters(priceUpdate)
            dispatch(searchFilters(priceUpdate))
        }else{
            let paramsFilter = {...filters,...selectedFilters,[key]:value}
            setFilters(paramsFilter)
            dispatch(searchFilters(paramsFilter))
        }

    }


    const instantConfirm = useMemo(()=>{
        if(allFilters?.instant_confirm){
            return allFilters?.instant_confirm.find(item=>item.selected).id
        }
    },[allFilters])





    return (
        <div className={styles.filters}>
             <ItemSwitch name={'filter_instant_confirm'} title={'Быстрое подтверждение'} setIsOn={onChangeFilters} isOn={instantConfirm} />
            {allFilters?.prices && filters?.filter_price_min>0 &&(
                <Collapse title={'Стоимость, ₽'} open={true}>
                    <RangeInput
                        step={1}
                        min={allFilters?.prices?.min || 0}
                        max={allFilters?.prices?.max || 0}
                        values={price}
                        setValues={setPrice}
                        onChangeComplete={onChangeFilters}
                        name={'price'}
                        title={'Цена'}
                        symbol={'₽'}
                    />
                </Collapse>
            )}

            {/*<Collapse title={'Расстояние до аэропорта, км'} open={true}>*/}
            {/*    <RangeInput*/}
            {/*        step={1}*/}
            {/*        min={0}*/}
            {/*        max={100}*/}
            {/*        values={km}*/}
            {/*        setValues={setKm}*/}
            {/*        title={'Цена'}*/}
            {/*        symbol={'км'}*/}
            {/*    />*/}
            {/*</Collapse>*/}
            {allFilters?.hotel_type && (
                <Collapse title={'Тип размещения'} open={true}>
                    <CheckboxGroup
                        name={'filter_hotel_type'}
                        options={[...allFilters?.hotel_type] || []}
                        // selected={selectedIds}
                        onChange={onChangeFilters}
                    />
                </Collapse>
            )}
            {allFilters?.meals && (
                <Collapse title={'Питание'} open={true}>
                    <CheckboxGroup
                        name={'filter_meals'}
                        options={[...allFilters?.meals] || []}
                        // selected={selectedIds}
                        onChange={onChangeFilters}
                    />
                </Collapse>
            )}
            {allFilters?.stars && (
                <Collapse title={'Количество звёзд'} open={true}>
                    <CheckboxGroup
                        name={'filter_stars'}
                        options={[...allFilters?.stars] || []}
                        // selected={filters?.filter_stars || []}
                        onChange={onChangeFilters}
                    />
                </Collapse>
            )}
            {allFilters?.regions && (
                <Collapse title={'Регион'} open={true}>
                    <CheckboxGroup
                        name={'filter_regions'}
                        options={[...allFilters?.regions] || []}
                        // selected={selectRating}
                        onChange={onChangeFilters}
                    />
                </Collapse>
            )}
            {allFilters?.line && (
                <Collapse title={'Линия пляжа'} open={true}>
                    <CheckboxGroup
                        name={'filter_line'}
                        options={[...allFilters?.line] || []}
                        // selected={selectRating}
                        onChange={onChangeFilters}
                    />
                </Collapse>
            )}

            {/*<Collapse title={'Расстояние до пляжа, м'} open={true}>*/}
            {/*    <RangeInput*/}
            {/*        step={1}*/}
            {/*        min={0}*/}
            {/*        max={100}*/}
            {/*        values={meter}*/}
            {/*        setValues={setMeter}*/}
            {/*        title={'Цена'}*/}
            {/*        symbol={'м'}*/}
            {/*    />*/}
            {/*</Collapse>*/}
            {allFilters?.operators && (
                <Collapse title={'Туроператор'} open={true}>
                    <CheckboxGroup
                        name={'filter_operators'}
                        options={allFilters?.operators || []}
                        // selected={selectRating}
                        onChange={onChangeFilters}
                    />
                </Collapse>
            )}

            {/*<ItemSwitch title={'Есть Wi-Fi'} setIsOn={setWifi} isOn={wifi} />*/}
            {/*<Collapse title={'Водные развлечения'}>*/}
            {/*    <p>km</p>*/}
            {/*</Collapse>*/}
            {/*<Collapse title={'Удобства в отеле'}>*/}
            {/*    <p>km</p>*/}
            {/*</Collapse>*/}
            {/*<Collapse title={'Для семей с детьми'} open={true}>*/}
            {/*    <CheckboxGroup*/}
            {/*        options={FOR_FAMALE}*/}
            {/*        selected={selectForFamale}*/}
            {/*        onChange={setSelectForFamale}*/}
            {/*    />*/}
            {/*</Collapse>*/}

        </div>
    );
};

export default Filters;
