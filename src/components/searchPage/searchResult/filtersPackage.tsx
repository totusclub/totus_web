import styles from '../searchPage.module.css';
import ItemSwitch from "@/components/UI/itemSwitch";
import {useEffect, useMemo, useState} from "react";
import { createPortal } from "react-dom";
import Collapse from "@/components/UI/collapse";
import CheckboxGroup from "@/components/UI/checkboxGroup";
import RangeInput from "@/components/UI/rangeInput";
import {searchFilters} from "@/store/slices/searchSlice";
import {useDispatch} from "react-redux";
import Icon from "@/components/icons/Icon";
import Button from "@/components/UI/button";

const FiltersPackage = ({allFilters,setFiltersRequest,netPrice}:any) => {
    const dispatch = useDispatch();
    const [price, setPrice] = useState([20,100]);
    const [km, setKm] = useState([20,60]);
    const [meter, setMeter] = useState([20,60]);
    const [mobileModal,setMobileModal]=useState(false);
    const [isMobile, setIsMobile] = useState(false);
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

    useEffect(() => {
        const checkMobile = () => {
            setIsMobile(window.innerWidth <= 1024);
        };
        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    useEffect(() => {
        if (!mobileModal || !isMobile) return;

        const scrollY = window.scrollY;
        const previousBodyPosition = document.body.style.position;
        const previousBodyTop = document.body.style.top;
        const previousBodyWidth = document.body.style.width;
        const previousHtmlOverflow = document.documentElement.style.overflow;

        document.body.style.position = 'fixed';
        document.body.style.top = `-${scrollY}px`;
        document.body.style.width = '100%';
        document.documentElement.style.overflow = 'hidden';
        document.body.classList.add('filter-modal-open');

        return () => {
            document.body.style.position = previousBodyPosition;
            document.body.style.top = previousBodyTop;
            document.body.style.width = previousBodyWidth;
            document.documentElement.style.overflow = previousHtmlOverflow;
            document.body.classList.remove('filter-modal-open');
            window.scrollTo(0, scrollY);
        };
    }, [mobileModal, isMobile]);

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
        <>
            <div className={styles.buttonFilterMob} onClick={() => setMobileModal(true)}>
                <Icon name={'filter'}/>
            </div>
            {(() => {
                const filtersPanel = (
                    <div className={`${styles.filters} ${mobileModal && isMobile ? styles.activeModal : ''}`}>
                        <div className={styles.mobileFilterHeader}>
                            <p>Фильтры</p>
                            <p onClick={()=>setMobileModal(false)} >Отменить</p>
                        </div>
                        <div className={styles.mobileFilterBody}>
                        {allFilters?.forward_airlines?.length > 0 && (
                            <Collapse title={'Авиакомпания туда'} open={true}>
                                <CheckboxGroup
                                    name={'forward_airlines'}
                                    options={[...allFilters?.forward_airlines] || []}
                                    onChange={onChangeFilters}
                                    pk={true}
                                    netPrice={netPrice}
                                />
                            </Collapse>
                        )}
                        {allFilters?.backward_airlines?.length > 0 && (
                            <Collapse title={'Авиакомпания обратно'} open={true}>
                                <CheckboxGroup
                                    name={'backward_airlines'}
                                    options={[...allFilters?.backward_airlines] || []}
                                    onChange={onChangeFilters}
                                    pk={true}
                                    netPrice={netPrice}
                                />
                            </Collapse>
                        )}
                        {allFilters?.departure_airports?.airports?.length > 0 && (
                            <Collapse title={'Аэропорт вылета'} open={true}>
                                <CheckboxGroup
                                    name={'departure_airports'}
                                    options={[...allFilters?.departure_airports?.airports] || []}
                                    onChange={onChangeFilters}
                                    pk={true}
                                    netPrice={netPrice}
                                />
                            </Collapse>
                        )}
                        {allFilters?.arrival_airports?.airports?.length > 0 && (
                            <Collapse title={'Аэропорт прибытия'} open={true}>
                                <CheckboxGroup
                                    name={'arrival_airports'}
                                    options={[...allFilters?.arrival_airports?.airports] || []}
                                    onChange={onChangeFilters}
                                    pk={true}
                                    netPrice={netPrice}
                                />
                            </Collapse>
                        )}
                        {allFilters?.forward_departure_intervals?.length > 0 && (
                            <Collapse title={'Время вылета туда'} open={true}>
                                <CheckboxGroup
                                    name={'forward_departure_intervals'}
                                    options={[...allFilters?.forward_departure_intervals] || []}
                                    onChange={onChangeFilters}
                                    pk={true}
                                    netPrice={netPrice}
                                />
                            </Collapse>
                        )}
                        {allFilters?.backward_departure_intervals?.length > 0 && (
                            <Collapse title={'Время вылета обратно'} open={true}>
                                <CheckboxGroup
                                    name={'backward_departure_intervals'}
                                    options={[...allFilters?.backward_departure_intervals] || []}
                                    onChange={onChangeFilters}
                                    pk={true}
                                    netPrice={netPrice}
                                />
                            </Collapse>
                        )}
                        {allFilters?.operators?.length > 0 && (
                            <Collapse title={'Туроператор'} open={true}>
                                <CheckboxGroup
                                    name={'operators'}
                                    options={[...allFilters?.operators] || []}
                                    onChange={onChangeFilters}
                                    pk={true}
                                    netPrice={netPrice}
                                />
                            </Collapse>
                        )}
                        {allFilters?.luggage_types?.length > 0 && (
                            <Collapse title={'Багаж'} open={true}>
                                <CheckboxGroup
                                    name={'luggage_types'}
                                    options={[...allFilters?.luggage_types] || []}
                                    onChange={onChangeFilters}
                                    pk={true}
                                    netPrice={netPrice}
                                />
                            </Collapse>
                        )}
                        {allFilters?.flight_classes?.length > 0 && (
                            <Collapse title={'Класс перелета'} open={true}>
                                <CheckboxGroup
                                    name={'flight_classes'}
                                    options={[...allFilters?.flight_classes] || []}
                                    onChange={onChangeFilters}
                                    pk={true}
                                    netPrice={netPrice}
                                />
                            </Collapse>
                        )}
                        {allFilters?.flight_types?.length > 0 && (
                            <Collapse title={'Тип рейса'} open={true}>
                                <CheckboxGroup
                                    name={'flight_types'}
                                    options={[...allFilters?.flight_types] || []}
                                    onChange={onChangeFilters}
                                    pk={true}
                                    netPrice={netPrice}
                                />
                            </Collapse>
                        )}
                        {allFilters?.transitions_count?.length > 0 && (
                            <Collapse title={'Пересадки'} open={true}>
                                <CheckboxGroup
                                    name={'transitions_count'}
                                    options={[...allFilters?.transitions_count] || []}
                                    onChange={onChangeFilters}
                                    pk={true}
                                    netPrice={netPrice}
                                />
                            </Collapse>
                        )}
                        </div>
                        <div className={styles.mobileFilterFooter}>
                            <Button title={'Применять'} full={true} onClick={() => setMobileModal(false)}/>
                        </div>
                    </div>
                );

                if (isMobile) {
                    return mobileModal && typeof document !== 'undefined'
                        ? createPortal(filtersPanel, document.body)
                        : null;
                }

                return filtersPanel;
            })()}
        </>

    );
};

export default FiltersPackage;
