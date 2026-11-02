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
import { parseUiPageNumber, toOperatorIdsCsv } from '@/utils/searchResults';
import type { RootState } from '@/store';
import {
    pickAppliedFiltersFromHotels,
    peekSearchListRestoreFlag,
    readSearchListState,
    replaceSearchListFilters,
    shouldRestoreSearchFilters,
} from '@/utils/searchListState';
import { countActiveFilters } from '@/utils/filterChips';
import HotelIcon from '@/components/icons/totus/HotelIcon';
import type { TotusIconKey } from '@/components/icons/totus/registry.generated';
import {
    AMENITY_ICONS,
    beachSurfaceIcon,
    beachTypeIcon,
    categoryIcon,
    confirmabilityIcon,
    hotelTypeIcon,
    mealIcon,
    wifiIcon,
} from '@/components/icons/totus/ltIcons';

const DEFAULT_FILTERS = {
    filter_instant_confirm: false,
    filter_stars: '3,4,5',
    sort_by: 'relevance' as string,
};

/** Extra list filters from grouped-hotels (CSV of ids). */
const EXTRA_LIST_FILTER_KEYS = [
    'filter_rating',
    'filter_wifi',
    'filter_beach_surface',
    'filter_beach_type',
    'filter_category',
    'filter_confirmability',
] as const;

/** Extra bool amenity filters (true when switch is on). */
const EXTRA_BOOL_FILTER_KEYS = [
    'filter_adults_only',
    'filter_direct_flight',
    'filter_aquapark',
    'filter_pool',
    'filter_kids_pool',
    'filter_heated_pool',
    'filter_kids_club',
    'filter_kids_menu',
    'filter_nanny',
    'filter_aircon',
    'filter_parking',
    'filter_bar',
    'filter_massage',
    'filter_thermal_fun',
    'filter_no_single_men',
] as const;

const BOOL_AMENITY_UI: Array<{
    key: (typeof EXTRA_BOOL_FILTER_KEYS)[number];
    apiKey: string;
    title: string;
}> = [
    { key: 'filter_adults_only', apiKey: 'adults_only', title: 'Только для взрослых' },
    { key: 'filter_direct_flight', apiKey: 'direct_flight', title: 'Прямой перелёт' },
    { key: 'filter_aquapark', apiKey: 'aquapark', title: 'Аквапарк' },
    { key: 'filter_pool', apiKey: 'pool', title: 'Бассейн' },
    { key: 'filter_kids_pool', apiKey: 'kids_pool', title: 'Детский бассейн' },
    { key: 'filter_heated_pool', apiKey: 'heated_pool', title: 'Подогреваемый бассейн' },
    { key: 'filter_kids_club', apiKey: 'kids_club', title: 'Детский клуб' },
    { key: 'filter_kids_menu', apiKey: 'kids_menu', title: 'Детское меню' },
    { key: 'filter_nanny', apiKey: 'nanny', title: 'Няня' },
    { key: 'filter_aircon', apiKey: 'aircon', title: 'Кондиционер' },
    { key: 'filter_parking', apiKey: 'parking', title: 'Парковка' },
    { key: 'filter_bar', apiKey: 'bar', title: 'Бар' },
    { key: 'filter_massage', apiKey: 'massage', title: 'Массаж' },
    { key: 'filter_thermal_fun', apiKey: 'thermal_fun', title: 'Термальные процедуры' },
    { key: 'filter_no_single_men', apiKey: 'no_single_men', title: 'Без одиноких мужчин' },
];

const LIST_FILTER_UI: Array<{
    key: (typeof EXTRA_LIST_FILTER_KEYS)[number];
    apiKey: string;
    title: string;
}> = [
    { key: 'filter_rating', apiKey: 'rating', title: 'Рейтинг' },
    { key: 'filter_wifi', apiKey: 'wifi', title: 'Wi-Fi' },
    { key: 'filter_beach_surface', apiKey: 'beach_surface', title: 'Покрытие пляжа' },
    { key: 'filter_beach_type', apiKey: 'beach_type', title: 'Тип пляжа' },
    { key: 'filter_category', apiKey: 'category', title: 'Категория' },
    { key: 'filter_confirmability', apiKey: 'confirmability', title: 'Подтверждение' },
];

/** Иконки вариантов фильтров (набор Totus): группа → id варианта Level.Travel → ключ иконки. */
type OptionIconFn = (option: { id?: unknown }) => TotusIconKey | null;
const OPTION_ICONS: Record<string, OptionIconFn> = {
    filter_hotel_type: (o) => hotelTypeIcon(o?.id as string | number),
    filter_meals: (o) => mealIcon(o?.id as string),
    filter_wifi: (o) => wifiIcon(o?.id as string),
    filter_beach_surface: (o) => beachSurfaceIcon(o?.id as string),
    filter_beach_type: (o) => beachTypeIcon(o?.id as string),
    filter_category: (o) => categoryIcon(o?.id as string),
    filter_confirmability: (o) => confirmabilityIcon(o?.id as string | number),
};
const switchIcon = (key: string) => <HotelIcon name={AMENITY_ICONS[key]} size={20} />;

/** Фильтры только для тура — в режиме «Отель» не показываются и не отправляются (план поиска, этап 3). */
const TOUR_ONLY_FILTER_KEYS = new Set<string>(['filter_direct_flight']);

/** isHotelSearch — поиск отелей: звёзды 3–5 по умолчанию не отмечаются (у отеля их нет в запросе). */
function buildFiltersFromHotels(hotels: any, isHotelSearch = false) {
    const saved = readSearchListState();
    const fromHotels = pickAppliedFiltersFromHotels(hotels);
    const fromSession = saved?.filters ?? {};
    // Do NOT pass saved.autoSearchKey here — that compared the key to itself
    // and always "restored" stale session filters (wifi etc. → 0 Turkey hotels).
    const restoring = shouldRestoreSearchFilters({
        restoreFlag: peekSearchListRestoreFlag(),
        hotelsRequestId: hotels?.request_id ? String(hotels.request_id) : null,
    });

    // Returning from hotel details: session snapshot is the source of truth.
    // Do not re-apply package defaults (AI / 3-5★) over the user's selection.
    if (restoring) {
        return {
            filter_instant_confirm: false,
            sort_by: 'relevance',
            ...fromHotels,
            ...fromSession,
            filter_meals: fromSession.filter_meals ?? fromHotels.filter_meals,
            filter_stars: fromSession.filter_stars ?? fromHotels.filter_stars,
            filter_operators: fromSession.filter_operators ?? fromHotels.filter_operators,
            filter_hotel_type: fromSession.filter_hotel_type ?? fromHotels.filter_hotel_type,
            filter_regions: fromSession.filter_regions ?? fromHotels.filter_regions,
            filter_line: fromSession.filter_line ?? fromHotels.filter_line,
            filter_instant_confirm:
                fromSession.filter_instant_confirm ??
                fromHotels.filter_instant_confirm ??
                false,
            sort_by: fromSession.sort_by ?? fromHotels.sort_by ?? 'relevance',
            filter_price_min: fromSession.filter_price_min ?? fromHotels.filter_price_min,
            filter_price_max: fromSession.filter_price_max ?? fromHotels.filter_price_max,
            ...Object.fromEntries(
                EXTRA_LIST_FILTER_KEYS.map((key) => [
                    key,
                    fromSession[key] ?? fromHotels[key],
                ]),
            ),
            ...Object.fromEntries(
                EXTRA_BOOL_FILTER_KEYS.map((key) => [
                    key,
                    fromSession[key] ?? fromHotels[key],
                ]),
            ),
        };
    }

    return {
        ...DEFAULT_FILTERS,
        ...fromSession,
        ...fromHotels,
        filter_meals:
            fromHotels.filter_meals ??
            fromSession.filter_meals ??
            (DEFAULT_FILTERS as { filter_meals?: string }).filter_meals,
        filter_stars:
            fromHotels.filter_stars ??
            fromSession.filter_stars ??
            (isHotelSearch ? undefined : DEFAULT_FILTERS.filter_stars),
        filter_operators: fromHotels.filter_operators ?? fromSession.filter_operators,
        filter_hotel_type: fromHotels.filter_hotel_type ?? fromSession.filter_hotel_type,
        filter_regions: fromHotels.filter_regions ?? fromSession.filter_regions,
        filter_line: fromHotels.filter_line ?? fromSession.filter_line,
        filter_instant_confirm:
            fromHotels.filter_instant_confirm ??
            fromSession.filter_instant_confirm ??
            DEFAULT_FILTERS.filter_instant_confirm,
        sort_by: fromHotels.sort_by ?? fromSession.sort_by ?? DEFAULT_FILTERS.sort_by,
        ...Object.fromEntries(
            EXTRA_LIST_FILTER_KEYS.map((key) => [
                key,
                fromHotels[key] ?? fromSession[key],
            ]),
        ),
        ...Object.fromEntries(
            EXTRA_BOOL_FILTER_KEYS.map((key) => [
                key,
                fromHotels[key] ?? fromSession[key],
            ]),
        ),
    };
}

const Filters = ({ selectedFilters, allFilters, statistics }: any) => {
    const { hotels, loading, startSearchValid } = useSelector((state: RootState) => state.search);
    const router = useRouter();
    const isHotelSearch = router.query.search_type === 'hotel';
    const dispatch = useDispatch();
    const [mobileModal, setMobileModal] = useState(false);
    const [isMobile, setIsMobile] = useState(false);
    const [price, setPrice] = useState<number[]>([0, 0]);
    const [priceReady, setPriceReady] = useState(false);
    const [filters, setFilters] = useState(() => buildFiltersFromHotels(hotels, isHotelSearch));
    const [pendingFilters, setPendingFilters] = useState(() => buildFiltersFromHotels(hotels, isHotelSearch));
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
        const readyOperators = toOperatorIdsCsv(
            hotels?.readyOperators ?? selectedFilters?.readyOperators,
        );
        if (!requestId) return null;
        return {
            request_id: requestId,
            ...(readyOperators ? { readyOperators } : {}),
        };
    };

    const getMergedFilterParams = (overrides: Record<string, unknown> = {}) => {
        const searchBase = getSearchBaseParams();
        if (!searchBase) return null;

        // Local UI state wins over persisted hotels payload; overrides (pending) win last.
        const source = { ...hotels, ...filters, ...overrides } as Record<string, unknown>;

        const extraList = Object.fromEntries(
            EXTRA_LIST_FILTER_KEYS.map((key) => {
                const value = source[key];
                if (value == null) return [key, undefined];
                // Keep '' so unchecked list filters stay cleared in params/state.
                return [key, value];
            }).filter(([, value]) => value !== undefined),
        );
        const extraBool = Object.fromEntries(
            EXTRA_BOOL_FILTER_KEYS.map((key) => {
                const value = source[key];
                // Поиск отелей: фильтры только для тура (прямой перелёт) не отправляем.
                if (isHotelSearch && TOUR_ONLY_FILTER_KEYS.has(key)) return [key, undefined];
                // Only send amenity filters when enabled (true).
                if (value === true || value === 'true') return [key, true];
                return [key, undefined];
            }).filter(([, value]) => value !== undefined),
        );

        const merged: Record<string, unknown> = {
            filter_instant_confirm:
                source.filter_instant_confirm ?? false,
            filter_stars: source.filter_stars,
            filter_meals: source.filter_meals,
            filter_hotel_type: source.filter_hotel_type,
            filter_regions: source.filter_regions,
            filter_line: source.filter_line,
            filter_operators: source.filter_operators,
            filter_price_min: source.filter_price_min ?? priceBounds.min,
            filter_price_max: source.filter_price_max ?? priceBounds.max,
            ...extraList,
            ...extraBool,
            sort_by: source.sort_by ?? router.query.sort_by ?? 'relevance',
            page_limit: 50,
            page_number: 1,
            ...searchBase,
            ...overrides,
        };

        // Keep '' / amenity false in params so Redux/session can clear selection.
        // getGroupedHotels strips them before the HTTP call.
        Object.keys(merged).forEach((key) => {
            const value = merged[key];
            if (value === undefined || value === null) {
                delete merged[key];
            }
        });

        return {
            ...merged,
            page_number: parseUiPageNumber(merged.page_number),
            page_limit: Math.max(1, Number(merged.page_limit) || 50),
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
            page_number: _pageNumber,
            page_limit: _pageLimit,
            ...filterFields
        } = params;

        setFilters((prev) => {
            const next = { ...prev };
            Object.entries(filterFields).forEach(([key, value]) => {
                if (value === undefined || value === null) {
                    delete (next as Record<string, unknown>)[key];
                } else if (
                    value === false &&
                    key !== 'filter_instant_confirm' &&
                    key.startsWith('filter_')
                ) {
                    // Amenity switched off — remove so UI stays unchecked.
                    delete (next as Record<string, unknown>)[key];
                } else {
                    // Keep '' for list filters so defaults are not re-applied.
                    (next as Record<string, unknown>)[key] = value;
                }
            });
            return next;
        });
        // Replace (not merge) so cleared checkboxes don't keep old values in session.
        const sessionFilters = pickAppliedFiltersFromHotels({
            ...hotels,
            ...filterFields,
        });
        Object.entries(filterFields).forEach(([key, value]) => {
            if (typeof value === 'string' && value.trim() === '' && key.startsWith('filter_')) {
                (sessionFilters as Record<string, unknown>)[key] = '';
            } else if (
                value === false &&
                key !== 'filter_instant_confirm' &&
                key.startsWith('filter_')
            ) {
                delete (sessionFilters as Record<string, unknown>)[key];
            }
        });
        replaceSearchListFilters(sessionFilters, String(params.request_id));
        dispatch(setAllMyHotels([]));
        dispatch(searchFilters(params));
    };

    // Все применённые фильтры одной строкой — чтобы эффект ниже ловил любое изменение,
    // включая удобства (раньше 11 ключей отсутствовали в deps и сайдбар не синхронизировался).
    const appliedFiltersKey = JSON.stringify(pickAppliedFiltersFromHotels(hotels));

    useEffect(() => {
        if (!hotels?.request_id) return;

        lastFilterRequestKeyRef.current = null;
        filtersSyncedRef.current = false;

        const restored = buildFiltersFromHotels(hotels, isHotelSearch);
        // Удобства, которых больше нет ни в hotels, ни в сессии (снятый тег над списком) — убираем,
        // иначе merge оставит старое true и переключатель в сайдбаре не погаснет.
        const mergeRestored = (prev: Record<string, unknown>) => {
            const next: Record<string, unknown> = { ...prev, ...restored };
            EXTRA_BOOL_FILTER_KEYS.forEach((key) => {
                if ((restored as Record<string, unknown>)[key] === undefined) delete next[key];
            });
            return next;
        };
        setFilters((prev) => mergeRestored(prev) as typeof prev);
        setPendingFilters((prev) => mergeRestored(prev) as typeof prev);
        // Ползунок цены живёт отдельным state — подтягиваем его к применённому диапазону
        // (например, после снятия тега цены над списком).
        if (restored.filter_price_min != null && restored.filter_price_max != null) {
            setPriceRange([Number(restored.filter_price_min), Number(restored.filter_price_max)]);
        }

        const restoring = shouldRestoreSearchFilters({
            restoreFlag: peekSearchListRestoreFlag(),
            hotelsRequestId: String(hotels.request_id),
        });
        // While restoring from hotel details, keep the session snapshot —
        // don't overwrite it with a partial hotels payload.
        if (!restoring) {
            // Replace (not merge) so unchecked filters stay cleared.
            replaceSearchListFilters(
                pickAppliedFiltersFromHotels(hotels),
                String(hotels.request_id),
            );
        }
        filtersSyncedRef.current = true;
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [hotels?.request_id, appliedFiltersKey]);

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
        // Must merge pendingFilters — checkbox/switch changes on mobile only update pending state.
        const filtersToApply = getMergedFilterParams({
            ...pendingFilters,
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
                    page_limit: 50,
                    page_number: 1
                }))
            } else {
                setPendingFilters(prev => ({
                    ...prev,
                    [key]: value,
                    page_limit: 50,
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

    const resolveBoolFilter = (key: (typeof EXTRA_BOOL_FILTER_KEYS)[number] | 'filter_instant_confirm') => {
        if (isMobile && mobileModal && pendingFilters?.[key] !== undefined) {
            return Boolean(pendingFilters[key]);
        }
        if (filters?.[key] !== undefined) {
            return Boolean(filters[key]);
        }
        return false;
    };

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
            return allFilters?.instant_confirm.find((item: { selected?: boolean }) => item.selected)?.id
        }
    }, [allFilters, filters, pendingFilters, isMobile, mobileModal])

    const activeFiltersCount = useMemo(() => countActiveFilters(hotels), [hotels]);
    const usePendingState = isMobile && mobileModal;
    const activeFilterValues = usePendingState ? pendingFilters : filters;

    // Поиск отелей: без «Прямого перелёта» (перелёта нет).
    const amenityUi = isHotelSearch
        ? BOOL_AMENITY_UI.filter(({ key }) => !TOUR_ONLY_FILTER_KEYS.has(key))
        : BOOL_AMENITY_UI;
    const hasAmenityFilters = amenityUi.some(
        ({ apiKey }) => Array.isArray(allFilters?.[apiKey]) && allFilters[apiKey].length > 0,
    );

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
                    icon={<HotelIcon name="instant" size={20} />}
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
                            optionIcon={OPTION_ICONS.filter_hotel_type}
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
                            optionIcon={OPTION_ICONS.filter_meals}
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
                                (allFilters?.stars || []).filter((star: { id?: unknown }) => String(star?.id) !== '0'),
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
                {LIST_FILTER_UI.map(({ key, apiKey, title }) => {
                    const options = allFilters?.[apiKey];
                    if (!Array.isArray(options) || options.length === 0) return null;
                    // Amenity-style bool lists (true/false) are handled as switches below
                    const onlyBoolIds = options.every(
                        (opt: { id?: unknown }) => typeof opt?.id === 'boolean',
                    );
                    if (onlyBoolIds) return null;
                    return (
                        <Collapse key={key} title={title} open={true}>
                            <CheckboxGroup
                                name={key}
                                optionIcon={OPTION_ICONS[key]}
                                options={getOptionsWithSelected(
                                    options,
                                    activeFilterValues?.[key],
                                )}
                                selected={activeFilterValues?.[key]}
                                onChange={onChangeFilters}
                            />
                        </Collapse>
                    );
                })}
                {hasAmenityFilters && (
                    <Collapse title={'Удобства'} open={true}>
                        {amenityUi.map(({ key, apiKey, title }) => {
                            const options = allFilters?.[apiKey];
                            if (!Array.isArray(options) || options.length === 0) return null;
                            return (
                                <ItemSwitch
                                    key={key}
                                    name={key}
                                    title={title}
                                    icon={switchIcon(key)}
                                    setIsOn={onChangeFilters}
                                    isOn={resolveBoolFilter(key)}
                                />
                            );
                        })}
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
                {activeFiltersCount > 0 && (
                    <span className={styles.filterBadge}>{activeFiltersCount}</span>
                )}
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
