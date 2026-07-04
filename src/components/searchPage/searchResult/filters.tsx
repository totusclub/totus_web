import styles from '../searchPage.module.css';
import ItemSwitch from "@/components/UI/itemSwitch";
import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import Collapse from "@/components/UI/collapse";
import CheckboxGroup from "@/components/UI/checkboxGroup";
import RangeInput from "@/components/UI/rangeInput";
import { searchFilters, setAllMyHotels } from '@/store/slices/searchSlice';
import { useDispatch, useSelector } from 'react-redux';
import Icon from "@/components/icons/Icon";
import Button from "@/components/UI/button";
import { useRouter } from 'next/router';
import { parseUiPageNumber } from '@/utils/searchResults';

const Filters = ({ selectedFilters, allFilters, statistics }: any) => {
    const { hotels, loading, startSearchValid } = useSelector((state: RootState) => state.search);
    const router = useRouter();
    const dispatch = useDispatch();
    const [mobileModal, setMobileModal] = useState(false);
    const [isMobile, setIsMobile] = useState(false);
    const [price, setPrice] = useState<number[]>([0, 0]);
    const [priceReady, setPriceReady] = useState(false);
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
    const priceInitializedRef = useRef(false);
    const lastRequestIdRef = useRef<string | null>(null);
    const lastFilterRequestKeyRef = useRef<string | null>(null);
    const filtersSyncedRef = useRef(false);

    const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);

    const priceBounds = useMemo(() => {
        const min = Number(allFilters?.prices?.min ?? 0);
        const max = Number(allFilters?.prices?.max ?? 0);
        return { min, max: max >= min ? max : min };
    }, [allFilters?.prices?.min, allFilters?.prices?.max]);

    const setPriceRange = (next: number[]) => {
        const left = clamp(Number(next?.[0] ?? priceBounds.min), priceBounds.min, priceBounds.max);
        const right = clamp(Number(next?.[1] ?? priceBounds.max), priceBounds.min, priceBounds.max);
        setPrice([Math.min(left, right), Math.max(left, right)]);
    };

    const priceStep = useMemo(() => {
        const span = priceBounds.max - priceBounds.min;
        if (span <= 0) return 1;
        if (span <= 10_000) return 100;
        if (span <= 100_000) return 1_000;
        if (span <= 500_000) return 5_000;
        return 10_000;
    }, [priceBounds.min, priceBounds.max]);

    const getSearchBaseParams = () => {
        const requestId = hotels?.request_id ?? selectedFilters?.request_id;
        const readyOperators = hotels?.readyOperators ?? selectedFilters?.readyOperators;
        if (!requestId) return null;
        return { request_id: requestId, readyOperators };
    };

    const getMergedFilterParams = (overrides: Record<string, unknown> = {}) => {
        const searchBase = getSearchBaseParams();
        if (!searchBase) return null;

        const merged = {
            filter_instant_confirm: filters.filter_instant_confirm ?? hotels?.filter_instant_confirm ?? false,
            filter_stars: filters.filter_stars ?? hotels?.filter_stars,
            filter_meals: filters.filter_meals ?? hotels?.filter_meals,
            filter_hotel_type: filters.filter_hotel_type ?? hotels?.filter_hotel_type,
            filter_regions: filters.filter_regions ?? hotels?.filter_regions,
            filter_line: filters.filter_line ?? hotels?.filter_line,
            filter_operators: filters.filter_operators ?? hotels?.filter_operators,
            filter_price_min: filters.filter_price_min ?? hotels?.filter_price_min ?? priceBounds.min,
            filter_price_max: filters.filter_price_max ?? hotels?.filter_price_max ?? priceBounds.max,
            sort_by: filters.sort_by ?? hotels?.sort_by ?? router.query.sort_by ?? 'relevance',
            page_limit: 20,
            page_number: 1,
            ...searchBase,
            ...overrides,
        };

        return {
            ...merged,
            page_number: parseUiPageNumber(merged.page_number),
            page_limit: Math.max(1, Number(merged.page_limit) || 20),
        };
    };

    const dispatchFilterSearch = (params: Record<string, unknown> | null) => {
        if (!params?.request_id) return;

        const requestKey = JSON.stringify(params);
        if (requestKey === lastFilterRequestKeyRef.current) return;

        lastFilterRequestKeyRef.current = requestKey;

        const {
            request_id: _requestId,
            readyOperators: _readyOperators,
            page_limit: _pageLimit,
            page_number: _pageNumber,
            ...filterFields
        } = params;

        setFilters((prev) => ({ ...prev, ...filterFields }));
        dispatch(setAllMyHotels([]));
        dispatch(searchFilters(params));
    };

    useEffect(() => {
        if (!hotels?.request_id) return;

        lastFilterRequestKeyRef.current = null;
        filtersSyncedRef.current = false;

        setFilters((prev) => ({
            ...prev,
            filter_instant_confirm: hotels.filter_instant_confirm ?? prev.filter_instant_confirm,
            filter_stars: hotels.filter_stars ?? prev.filter_stars,
            filter_meals: hotels.filter_meals ?? prev.filter_meals,
            filter_hotel_type: hotels.filter_hotel_type ?? prev.filter_hotel_type,
            filter_regions: hotels.filter_regions ?? prev.filter_regions,
            filter_line: hotels.filter_line ?? prev.filter_line,
            filter_operators: hotels.filter_operators ?? prev.filter_operators,
            sort_by: hotels.sort_by ?? prev.sort_by,
        }));
        filtersSyncedRef.current = true;
    }, [hotels?.request_id]);

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
        if (!allFilters?.prices) return;

        const requestId = selectedFilters?.request_id ?? null;
        if (requestId !== lastRequestIdRef.current) {
            lastRequestIdRef.current = requestId;
            priceInitializedRef.current = false;
            setPriceReady(false);
        }

        if (!priceInitializedRef.current) {
            const initialMin = priceBounds.min;
            const initialMax = priceBounds.max;

            setPrice([initialMin, initialMax]);
            setFilters((prev) => ({
                ...prev,
                filter_price_min: initialMin,
                filter_price_max: initialMax,
            }));
            setPendingFilters((prev) => ({
                ...prev,
                filter_price_min: initialMin,
                filter_price_max: initialMax,
            }));
            priceInitializedRef.current = true;
            setPriceReady(true);
        }
    }, [allFilters?.prices?.min, allFilters?.prices?.max, priceBounds.min, priceBounds.max, selectedFilters?.request_id])


    // Apply filters function - used on mobile when Apply button is clicked
    const applyFilters = () => {
        const filtersToApply = getMergedFilterParams({
            filter_price_min: price[0],
            filter_price_max: price[1],
        });
        if (!filtersToApply) return;

        setPendingFilters((prev) => ({ ...prev, ...filtersToApply }));
        dispatchFilterSearch(filtersToApply);
        setMobileModal(false);
    }

    const onChangeFilters = (key: string, value: string | boolean | number[]) => {
        // On mobile with modal open: only update pendingFilters, don't apply
        if (isMobile && mobileModal) {
            if (key === 'price' && Array.isArray(value)) {
                setPriceRange(value);
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
            setPriceRange(value);
            dispatchFilterSearch(getMergedFilterParams({
                filter_price_min: value[0],
                filter_price_max: value[1],
            }));
            return;
        }

        dispatchFilterSearch(getMergedFilterParams({ [key]: value }));
    }

    // Sync pendingFilters when opening modal on mobile
    useEffect(() => {
        if (mobileModal && isMobile) {
            // When opening modal, sync pendingFilters with current filters
            setPendingFilters({ ...filters })
            // Also sync price state if filters have price values
            if (filters?.filter_price_min !== undefined && filters?.filter_price_max !== undefined) {
                setPriceRange([filters.filter_price_min, filters.filter_price_max])
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
                {allFilters?.prices && priceBounds.max >= priceBounds.min && priceReady && (
                    <Collapse title={'Стоимость, ₽'} open={true}>
                        <RangeInput
                            step={priceStep}
                            min={priceBounds.min}
                            max={priceBounds.max}
                            values={price}
                            setValues={setPriceRange}
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
