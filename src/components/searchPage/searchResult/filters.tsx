import styles from '../searchPage.module.css';
import ItemSwitch from "@/components/UI/itemSwitch";
import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
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

    const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);

    const priceBounds = useMemo(() => {
        const min = Number(allFilters?.prices?.min ?? 0);
        const max = Number(allFilters?.prices?.max ?? 0);
        return { min, max: max >= min ? max : min };
    }, [allFilters?.prices?.min, allFilters?.prices?.max]);

    const safePrice = useMemo(() => {
        const min = priceBounds.min;
        const max = priceBounds.max;
        const left = clamp(Number(price?.[0] ?? min), min, max);
        const right = clamp(Number(price?.[1] ?? max), min, max);
        return [Math.min(left, right), Math.max(left, right)];
    }, [price, priceBounds]);

    // Detect mobile screen
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



    useEffect(() => {
        if (allFilters) {
            const updatedFilters = {
                ...filters,
                filter_price_min: priceBounds.min,
                filter_price_max: priceBounds.max
            }
            setFilters(updatedFilters)
            setPendingFilters(updatedFilters)
        }
        const rawMin = Number(statistics?.shown_min_price ?? priceBounds.min);
        const rawMax = Number(statistics?.shown_max_price ?? priceBounds.max);
        setPrice([
            clamp(rawMin, priceBounds.min, priceBounds.max),
            clamp(rawMax, priceBounds.min, priceBounds.max),
        ]);
    }, [allFilters, statistics, priceBounds.min, priceBounds.max])




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
            const optionId = String(
                option?.id ?? option?.luggage_type ?? option?.flight_class ?? option?.number ?? option?.flight_type
            );
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

    const usePendingState = isMobile && mobileModal;
    const activeFilterValues = usePendingState ? pendingFilters : filters;

    const filtersPanel = (
        <div className={`${styles.filters} ${usePendingState ? styles.activeModal : ''}`}>
            <div className={styles.mobileFilterHeader}>
                <p>Фильтры</p>
                <p onClick={handleCancel}>Отменить</p>
            </div>
            <div className={styles.mobileFilterBody}>
                <ItemSwitch
                    name={'filter_instant_confirm'}
                    title={'Быстрое подтверждение'}
                    setIsOn={onChangeFilters}
                    isOn={instantConfirm}
                />
                {allFilters?.prices && filters?.filter_price_min > 0 && (
                    <Collapse title={'Стоимость, ₽'} open={true}>
                        <RangeInput
                            step={1}
                            min={priceBounds.min}
                            max={priceBounds.max}
                            values={safePrice}
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
                                activeFilterValues?.filter_hotel_type
                            )}
                            selected={activeFilterValues?.filter_hotel_type}
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
                                activeFilterValues?.filter_meals
                            )}
                            selected={activeFilterValues?.filter_meals}
                            onChange={onChangeFilters}
                        />
                    </Collapse>
                )}
                {allFilters?.stars && (
                    <Collapse title={'Количество звёзд'} open={true}>
                        <CheckboxGroup
                            name={'filter_stars'}
                            options={getOptionsWithSelected(
                                (allFilters?.stars || []).filter((star) => String(star?.id) !== '0'),
                                activeFilterValues?.filter_stars
                            )}
                            selected={activeFilterValues?.filter_stars}
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
                                activeFilterValues?.filter_regions
                            )}
                            selected={activeFilterValues?.filter_regions}
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
                                activeFilterValues?.filter_line
                            )}
                            selected={activeFilterValues?.filter_line}
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
                                activeFilterValues?.filter_operators
                            )}
                            selected={activeFilterValues?.filter_operators}
                            onChange={onChangeFilters}
                        />
                    </Collapse>
                )}
            </div>
            <div className={styles.mobileFilterFooter}>
                <Button title={'Применять'} full={true} onClick={applyFilters} />
            </div>
        </div>
    );

    return (
        <>
            <div className={styles.buttonFilterMob} onClick={() => setMobileModal(true)}>
                <Icon name={'filter'} />
            </div>
            {isMobile
                ? (mobileModal && typeof document !== 'undefined'
                    ? createPortal(filtersPanel, document.body)
                    : null)
                : filtersPanel}
        </>
    );
};

export default Filters;
