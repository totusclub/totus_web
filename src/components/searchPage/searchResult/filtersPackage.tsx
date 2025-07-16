import styles from '../searchPage.module.css';
import ItemSwitch from "@/components/UI/itemSwitch";
import {useEffect, useMemo, useState} from "react";
import Collapse from "@/components/UI/collapse";
import CheckboxGroup from "@/components/UI/checkboxGroup";
import RangeInput from "@/components/UI/rangeInput";
import {searchFilters} from "@/store/slices/searchSlice";
import {useDispatch} from "react-redux";

const FiltersPackage = ({allFilters,setFiltersRequest,netPrice}:any) => {
    const dispatch = useDispatch();
    const [price, setPrice] = useState([20,100]);
    const [km, setKm] = useState([20,60]);
    const [meter, setMeter] = useState([20,60]);
    const [filters,setFilters] = useState(    {
        arrival_airports: [],
        departure_airports: [],
        forward_airlines: [],
        backward_airlines: [],
        flight_classes: [],
        flight_types: [],
        transitions_count: [],
        transitions_time: [],
        operators: [],
        insurance: [],
        transfer: [],
        luggage_types: [],
        forward_arrival_dates: [],
        forward_departure_time: {from: '', to: ''},
        backward_departure_time: {from: "", to: ""},
        payment_benefits: [],
        confirmability: [],
        package_id: 377680913,
        tour_ids: [],
        // "sign": "280f5d8d9217324c5ff1fb6736f177e7"
    })









    const onChangeFilters = (key: string, value: string | boolean | number) => {
        const intArray = value
            .split(',')
            .map((v) => v.trim())
            .filter((v) => v && v !== '...') // Remove empty strings and junk
            .map((v) => /^\d+$/.test(v) ? Number(v) : v);
        const updatedFilters = { ...filters, [key]: intArray[0] === 0 ?[]:intArray };
        setFilters(updatedFilters);
        setFiltersRequest(updatedFilters)
    };


    // const instantConfirm = useMemo(()=>{
    //     if(allFilters?.instant_confirm){
    //         return allFilters?.instant_confirm.find(item=>item.selected).id
    //     }
    // },[allFilters])



    return (
        <div className={styles.filters}>
            {/*<ItemSwitch name={'filter_instant_confirm'} title={'Быстрое подтверждение'} setIsOn={onChangeFilters} isOn={instantConfirm} />*/}
            {allFilters?.backward_airlines && (
                <Collapse title={'Авиакомпания туда'} open={true}>
                    <CheckboxGroup
                        name={'forward_airlines'}
                        options={[...allFilters?.forward_airlines] || []}
                        // selected={selectedIds}
                        onChange={onChangeFilters}
                        pk={true}
                        netPrice={netPrice}
                    />
                </Collapse>
            )}
            {allFilters?.operators && (
                <Collapse title={'Туроператор'} open={true}>
                    <CheckboxGroup
                        name={'operators'}
                        options={[...allFilters?.operators] || []}
                        // selected={selectedIds}
                        onChange={onChangeFilters}
                        pk={true}
                        netPrice={netPrice}
                    />
                </Collapse>
            )}
            {allFilters?.luggage_types && (
                <Collapse title={'С багажом'} open={true}>
                    <CheckboxGroup
                        name={'luggage_types'}
                        options={[...allFilters?.luggage_types] || []}
                        // selected={selectedIds}
                        onChange={onChangeFilters}
                        pk={true}
                        netPrice={netPrice}
                    />
                </Collapse>
            )}
            {allFilters?.luggage_types && (
                <Collapse title={'Класс перелета'} open={true}>
                    <CheckboxGroup
                        name={'flight_classes'}
                        options={[...allFilters?.flight_classes] || []}
                        // selected={selectedIds}
                        onChange={onChangeFilters}
                        pk={true}
                        netPrice={netPrice}
                    />
                </Collapse>
            )}
            {allFilters?.flight_types && (
                <Collapse title={'Тип рейса'} open={true}>
                    <CheckboxGroup
                        name={'flight_types'}
                        options={[...allFilters?.flight_types] || []}
                        // selected={selectedIds}
                        onChange={onChangeFilters}
                        pk={true}
                        netPrice={netPrice}
                    />
                </Collapse>
            )}
            {allFilters?.transitions_count && (
                <Collapse title={'Пересадки'} open={true}>
                    <CheckboxGroup
                        name={'transitions_count'}
                        options={[...allFilters?.transitions_count] || []}
                        // selected={selectedIds}
                        onChange={onChangeFilters}
                        pk={true}
                        netPrice={netPrice}
                    />
                </Collapse>
            )}
        </div>
    );
};

export default FiltersPackage;
