import styles from '../searchPage.module.css';
import ItemSwitch from "@/components/UI/itemSwitch";
import { useEffect, useMemo, useState } from "react";
import Collapse from "@/components/UI/collapse";
import CheckboxGroup from "@/components/UI/checkboxGroup";
import RangeInput from "@/components/UI/rangeInput";
import { searchFilters, setAllMyHotels, setLoadMore } from '@/store/slices/searchSlice';
import { useDispatch, useSelector } from 'react-redux';
import Icon from "@/components/icons/Icon";
import Button from "@/components/UI/button";
import { useRouter } from 'next/router';
import { RootState } from '@/store';

const Filters = ({ selectedFilters, allFilters, statistics }: any) => {
    const { hotels, loading, startSearchValid, loadMore } = useSelector((state: RootState) => state.search);
    const router = useRouter();
    const dispatch = useDispatch();
    const [mobileModal, setMobileModal] = useState(false);
    const [isMobile, setIsMobile] = useState(false);
    const [price, setPrice] = useState([20, 100]);
    const [km, setKm] = useState([20, 60]);
    const [meter, setMeter] = useState([20, 60]);
    const [filters, setFilters] = useState({
        filter_instant_confirm: false,
        filter_stars: '3,4,5',
        sort_by: 'relevance'
    })
    const [pendingFilters, setPendingFilters] = useState({
        filter_instant_confirm: false,
        filter_stars: '3,4,5',
        sort_by: 'relevance'
    })

    // Detect mobile screen
    useEffect(() => {
        const checkMobile = () => {
            setIsMobile(window.innerWidth <= 768);
        };
        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);



    useEffect(() => {
        if (allFilters) {
            const updatedFilters = {
                ...filters,
                filter_price_min: allFilters?.prices?.min || 0,
                filter_price_max: allFilters?.prices?.max || 0
            }
            setFilters(updatedFilters)
            setPendingFilters(updatedFilters)
        }
        if (statistics) {
            setPrice([statistics.shown_min_price || 0, statistics?.shown_max_price || 0]);
        }

    }, [allFilters, statistics])




    // Apply filters function - used on mobile when Apply button is clicked
    const applyFilters = () => {
        // Include current price state if it was changed
        const filtersToApply = {
            ...pendingFilters,
            ...selectedFilters,
            filter_price_min: price[0],
            filter_price_max: price[1],
            page_limit: 20,
            page_number: 1
        }

        setFilters(filtersToApply)
        dispatch(setAllMyHotels([]))
        dispatch(searchFilters(filtersToApply))

        const newQuery = {
            ...router.query,
            page_number: 1,
        };

        router.push(
            {
                pathname: router.pathname,
                query: newQuery,
            },
            undefined,
            { scroll: false }
        );

        setMobileModal(false)
    }

    const onChangeFilters = (key: string, value: string | boolean | number[]) => {
        // On mobile with modal open: only update pendingFilters, don't apply
        if (isMobile && mobileModal) {
            if (key === 'price' && Array.isArray(value)) {
                setPendingFilters(prev => ({
                    ...prev,
                    filter_price_min: value[0],
                    filter_price_max: value[1],
                    page_limit: 20,
                    page_number: 1
                }))
            } else {
                setPendingFilters(prev => ({
                    ...prev,
                    [key]: value,
                    page_limit: 20,
                    page_number: 1
                }))
            }
            return // Don't apply filters on mobile, wait for Apply button
        }

        // Desktop or mobile outside modal: apply immediately
        if (key === 'price' && Array.isArray(value)) {
            const priceUpdate = {
                ...filters,
                ...selectedFilters,
                filter_price_min: value[0],
                filter_price_max: value[1],
                page_limit: 20,
                page_number: 1
            }
            dispatch(setAllMyHotels([]))
            setFilters(priceUpdate)
            dispatch(searchFilters(priceUpdate))
        } else {
            const paramsFilter = { ...filters, ...selectedFilters, [key]: value, page_limit: 20, page_number: 1 }
            setFilters(paramsFilter)
            dispatch(setAllMyHotels([]))
            dispatch(searchFilters(paramsFilter))
        }
        const newQuery = {
            ...router.query,
            page_number: 1,
        };

        router.push(
            {
                pathname: router.pathname,
                query: newQuery,
            },
            undefined,
            { scroll: false }
        );

    }

    // Sync pendingFilters when opening modal on mobile
    useEffect(() => {
        if (mobileModal && isMobile) {
            // When opening modal, sync pendingFilters with current filters
            setPendingFilters({ ...filters })
            // Also sync price state if filters have price values
            if (filters?.filter_price_min !== undefined && filters?.filter_price_max !== undefined) {
                setPrice([filters.filter_price_min, filters.filter_price_max])
            }
        }
    }, [mobileModal, isMobile])

    const handleCancel = () => {
        // Reset pendingFilters to current filters when canceling
        setPendingFilters({ ...filters })
        setMobileModal(false)
    }

    // Helper function to mark options as selected based on selected values
    const getOptionsWithSelected = (options: any[], selectedValue: string | string[] | undefined) => {
        if (!options) return [];

        // Convert selectedValue to array of strings/numbers
        const selectedArray = !selectedValue
            ? []
            : Array.isArray(selectedValue)
                ? selectedValue.map(v => String(v)).filter(v => v)
                : typeof selectedValue === 'string'
                    ? selectedValue.split(',').map(v => v.trim()).filter(v => v)
                    : [];

        return options.map(option => {
            const optionId = String(option.id || option.luggage_type || option.flight_class || option.number || option.flight_type);
            return {
                ...option,
                selected: selectedArray.includes(optionId)
            };
        });
    }

    const instantConfirm = useMemo(() => {
        // On mobile with modal open, use pendingFilters
        if (isMobile && mobileModal && pendingFilters?.filter_instant_confirm !== undefined) {
            return pendingFilters.filter_instant_confirm
        }
        // Otherwise use current filters or allFilters
        if (filters?.filter_instant_confirm !== undefined) {
            return filters.filter_instant_confirm
        }
        if (allFilters?.instant_confirm) {
            return allFilters?.instant_confirm.find(item => item.selected).id
        }
    }, [allFilters, filters, pendingFilters, isMobile, mobileModal])


    useEffect(() => {
        if (!router.isReady) return;
        const pageNumber = parseInt((router.query.page_number as string) || "1", 10);
        if (pageNumber > 1 && loadMore) {
            let paramsFilter: any = { ...filters, ...selectedFilters, page_limit: 20, page_number: pageNumber }

            // Preserve sort_by if it exists in URL
            if (router.query.sort_by) {
                paramsFilter.sort_by = router.query.sort_by;
            }

            setFilters(paramsFilter)
            dispatch(searchFilters(paramsFilter))
            dispatch(setLoadMore(false))
        }
    }, [router.query]);


    return (
        <>
            <div className={styles.buttonFilterMob} onClick={() => setMobileModal(true)}>
                <Icon name={'filter'} />
            </div>
            <div className={`${styles.filters} ${mobileModal && styles.activeModal}`}>
                <div className={styles.mobileFilterHeader}>
                    <p>Фильтры</p>
                    <p onClick={handleCancel} >Отменить</p>
                </div>
                <ItemSwitch name={'filter_instant_confirm'} title={'Быстрое подтверждение'} setIsOn={onChangeFilters}
                    isOn={instantConfirm} />
                {allFilters?.prices && filters?.filter_price_min > 0 && (
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
                {allFilters?.hotel_type && (
                    <Collapse title={'Тип размещения'} open={true}>
                        <CheckboxGroup
                            name={'filter_hotel_type'}
                            options={getOptionsWithSelected(
                                allFilters?.hotel_type || [],
                                isMobile && mobileModal ? pendingFilters?.filter_hotel_type : filters?.filter_hotel_type
                            )}
                            selected={isMobile && mobileModal ? pendingFilters?.filter_hotel_type : filters?.filter_hotel_type}
                            onChange={onChangeFilters}
                        />
                    </Collapse>
                )}
                {allFilters?.meals && (
                    <Collapse title={'Питание'} open={true}>
                        <CheckboxGroup
                            name={'filter_meals'}
                            options={getOptionsWithSelected(
                                allFilters?.meals || [],
                                isMobile && mobileModal ? pendingFilters?.filter_meals : filters?.filter_meals
                            )}
                            selected={isMobile && mobileModal ? pendingFilters?.filter_meals : filters?.filter_meals}
                            onChange={onChangeFilters}
                        />
                    </Collapse>
                )}
                {allFilters?.stars && (
                    <Collapse title={'Количество звёзд'} open={true}>
                        <CheckboxGroup
                            name={'filter_stars'}
                            options={getOptionsWithSelected(
                                allFilters?.stars || [],
                                isMobile && mobileModal ? pendingFilters?.filter_stars : filters?.filter_stars
                            )}
                            selected={isMobile && mobileModal ? pendingFilters?.filter_stars : filters?.filter_stars}
                            onChange={onChangeFilters}
                        />
                    </Collapse>
                )}
                {allFilters?.regions && (
                    <Collapse title={'Регион'} open={true}>
                        <CheckboxGroup
                            name={'filter_regions'}
                            options={getOptionsWithSelected(
                                allFilters?.regions || [],
                                isMobile && mobileModal ? pendingFilters?.filter_regions : filters?.filter_regions
                            )}
                            selected={isMobile && mobileModal ? pendingFilters?.filter_regions : filters?.filter_regions}
                            onChange={onChangeFilters}
                        />
                    </Collapse>
                )}
                {allFilters?.line && (
                    <Collapse title={'Линия пляжа'} open={true}>
                        <CheckboxGroup
                            name={'filter_line'}
                            options={getOptionsWithSelected(
                                allFilters?.line || [],
                                isMobile && mobileModal ? pendingFilters?.filter_line : filters?.filter_line
                            )}
                            selected={isMobile && mobileModal ? pendingFilters?.filter_line : filters?.filter_line}
                            onChange={onChangeFilters}
                        />
                    </Collapse>
                )}
                {allFilters?.operators && (
                    <Collapse title={'Туроператор'} open={true}>
                        <CheckboxGroup
                            name={'filter_operators'}
                            options={getOptionsWithSelected(
                                allFilters?.operators || [],
                                isMobile && mobileModal ? pendingFilters?.filter_operators : filters?.filter_operators
                            )}
                            selected={isMobile && mobileModal ? pendingFilters?.filter_operators : filters?.filter_operators}
                            onChange={onChangeFilters}
                        />
                    </Collapse>
                )}
                <div className={styles.mobileFilterFooter}>
                    <Button title={'Применять'} full={true} onClick={applyFilters} />
                </div>
            </div>
        </>

    );
};

export default Filters;
