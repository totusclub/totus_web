import styles from './search.module.css';
import Icon from "@/components/icons/Icon";
import Button from "@/components/UI/button";
import People from "@/components/search/people";
import Nights from "@/components/search/nights";
import WhereTo from "@/components/search/whereTo";
import WhereFrom from "@/components/search/whereFrom";
import SelectDate from "@/components/search/date";
import { useRouter } from "next/router";
import { useCallback, useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from 'react-redux';
import { runFullSearchFlow, setStartSearch } from '@/store/slices/searchSlice';
import { RootState } from '@/store';
import { stayRangeFromDeparture } from '@/utils/calendarDateRange';

/** Same as historical `calculateStayDates` return value (3 keys only; no `start_date_till`). */
function legacyStayDatesFromRange(startDateStr: string | Date, nightCount: number) {
    const r = stayRangeFromDeparture(startDateStr, nightCount);
    return {
        start_date: r.start_date,
        start_date_from: r.start_date_from,
        end_date_till: r.end_date_till,
    };
}

interface SearchFormProps {
    header?: boolean;
    pageName?: string;
}

interface SearchParams {
    from_city: string;
    to_country: string;
    adults: string;
    start_date: string;
    nights: string;
    flex_dates: string;
    start_date_from: string;
    start_date_till: string;
    end_date_from: string;
    end_date_till: string;
    from_country: string;
    to_city: string;
    kids: string;
    kids_ages: number[];
    search_type: string;
    hotel_ids: number[];
    page_number: number;
    page_limit: number;
    sort_by: string;
}

const DEFAULT_INITIAL_NIGHTS = 7;

type SearchTypeValue = 'package' | 'hotel';

const SEARCH_TYPE_TABS: { id: SearchTypeValue; label: string; icon: 'plane' | 'hotel' }[] = [
    { id: 'package', label: 'Тур', icon: 'plane' },
    { id: 'hotel', label: 'Отель', icon: 'hotel' },
];

function SearchTypeTabs({
    value,
    onChange,
}: {
    value: SearchTypeValue;
    onChange: (type: SearchTypeValue) => void;
}) {
    const tabsRef = useRef<HTMLDivElement>(null);
    const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);
    const [indicator, setIndicator] = useState({ left: 0, width: 0 });

    const activeIndex = Math.max(
        0,
        SEARCH_TYPE_TABS.findIndex((tab) => tab.id === value)
    );

    const updateIndicator = useCallback(() => {
        const btn = tabRefs.current[activeIndex];
        if (!btn) return;
        setIndicator({
            left: btn.offsetLeft,
            width: btn.offsetWidth,
        });
    }, [activeIndex]);

    useEffect(() => {
        updateIndicator();
        const container = tabsRef.current;
        if (!container) return;

        const ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(updateIndicator) : null;
        ro?.observe(container);
        window.addEventListener('resize', updateIndicator);

        return () => {
            ro?.disconnect();
            window.removeEventListener('resize', updateIndicator);
        };
    }, [updateIndicator, value]);

    return (
        <div className={styles.searchTypeTabs} ref={tabsRef} role="tablist" aria-label="Тип поиска">
            <div
                className={styles.searchTypeTabIndicator}
                style={{
                    width: indicator.width,
                    transform: `translateX(${indicator.left}px)`,
                }}
                aria-hidden
            />
            {SEARCH_TYPE_TABS.map((tab, index) => {
                const isActive = value === tab.id;
                return (
                    <button
                        key={tab.id}
                        ref={(el) => {
                            tabRefs.current[index] = el;
                        }}
                        type="button"
                        role="tab"
                        aria-selected={isActive}
                        className={`${styles.searchTypeTab} ${isActive ? styles.searchTypeTabActive : ''}`}
                        onClick={() => onChange(tab.id)}
                    >
                        <span className={styles.searchTypeTabIcon}>
                            <Icon
                                name={tab.icon}
                                size={20}
                                color={isActive ? 'var(--core_Orange)' : 'rgba(255, 255, 255, 0.95)'}
                            />
                        </span>
                        <span className={styles.searchTypeTabText}>
                            <span className={styles.searchTypeTabLabel}>{tab.label}</span>
                            <span className={styles.searchTypeTabHint}>
                                {tab.id === 'package' ? 'С перелётом' : 'Без перелёта'}
                            </span>
                        </span>
                    </button>
                );
            })}
        </div>
    );
}

const SearchForm = ({ header, pageName }: SearchFormProps) => {
    const { hotels, loading, headerName, startSearchValid } = useSelector((state: RootState) => state.search);


    const dispatch = useDispatch();
    const router = useRouter();
    const [params, setParams] = useState<SearchParams>(() => {
        const today = new Date();
        const plus7 = new Date();
        plus7.setDate(today.getDate() + 7);
        const interval = legacyStayDatesFromRange(plus7, DEFAULT_INITIAL_NIGHTS);
        return {
            from_city: 'Moscow',
            from_country: 'RU',
            to_country: 'EG',
            adults: '1',
            nights: String(DEFAULT_INITIAL_NIGHTS),
            flex_dates: '0',
            ...interval,
            start_date_till: '',
            end_date_from: '',
            to_city: '',
            kids: '0',
            kids_ages: [],
            hotel_ids: [],
            search_type: 'package',
            page_limit: 20,
            page_number: 1,
            sort_by: 'relevance',
        };
    });

    const getNightCount = (value: string | number | undefined) => {
        if (typeof value === 'number') return value;
        if (typeof value === 'string') {
            const raw = value.split('..')[0] || value;
            const parsed = parseInt(raw, 10);
            return Number.isFinite(parsed) ? parsed : 7;
        }
        return 7;
    };

    function calculateStayDates(startDateStr: string | Date, nightCount: number) {
        return legacyStayDatesFromRange(startDateStr, nightCount);
    }

    useEffect(() => {
        if (!router.isReady || (pageName !== 'search' && pageName !== 'home')) return;

        const parsed = parseSearchParams(router.query);

        setParams((prev) => {
            let next: SearchParams = { ...prev };

            if (parsed?.to_city) {
                next = { ...next, ...parsed };
            } else {
                const { to_city: _pq, ...restParsed } = parsed || {};
                const { to_city, ...restPrev } = next;
                next = { ...restPrev, ...restParsed } as SearchParams;
            }

            if (parsed?.hotel_ids) {
                next = { ...next, hotel_ids: parsed.hotel_ids };
            }

            if (Object.keys(parsed).length === 0) {
                const today = new Date();
                const plus7 = new Date();
                plus7.setDate(today.getDate() + 7);
                next = { ...next, ...legacyStayDatesFromRange(plus7, getNightCount(next.nights)) };
            }

            if (Object.keys(parsed).length > 0) {
                queueMicrotask(() => startSearch(next));
            }

            return next;
        });
    }, [router.isReady, pageName]);

    const startSearch = async (data: SearchParams) => {
        // console.log('data',data,params?.hotel_ids?.length> 0);
        if (+data?.page_number === 1 && startSearchValid) {
            if (data?.hotel_ids?.length > 0) {
                dispatch(runFullSearchFlow({
                    searchParams: data,
                    filterParams: {
                        filter_instant_confirm: false,
                        page_number: data.page_number,
                        page_limit: data.page_limit,
                        sort_by: data?.sort_by || 'relevance'
                    }
                }));
            } else {
                const filterParams: Record<string, unknown> = {
                    filter_instant_confirm: false,
                    page_number: data.page_number,
                    page_limit: data.page_limit,
                    sort_by: data?.sort_by || 'relevance',
                };
                if (data.search_type !== 'hotel') {
                    filterParams.filter_stars = '3,4,5';
                    filterParams.filter_meals = 'AI';
                }
                dispatch(runFullSearchFlow({
                    searchParams: data,
                    filterParams,
                }));
            }
            dispatch(setStartSearch(false))
        }

    }



    const handleChange = (value: any, key: keyof SearchParams | 'form_date' | 'date_range' | 'sync_nights_from_dates', type?: string) => {
        if ((key as string) === 'sync_nights_from_dates') {
            const n = typeof value === 'number' ? value : parseInt(String(value), 10);
            if (!Number.isFinite(n) || n < 1) return;
            setParams((prev) => ({ ...prev, nights: String(n) }));
            return;
        }
        if ((key as string) === 'date_range' && value && typeof value === 'object' && 'start' in value && 'end' in value) {
            const dr = value as { start: string; end: string };
            setParams((prev) => ({
                ...prev,
                start_date: dr.start,
                start_date_from: dr.start,
                end_date_till: dr.end,
            }));
            return;
        }
        if (key === 'from_city') {
            setParams((prev) => ({
                ...prev,
                from_country: value?.iso2
            }));
        } else if (key === 'to_city') {
            if (type === 'countries') {
                delete params.hotel_ids
                setParams((prev) => ({
                    ...prev,
                    to_country: value?.iso2
                }));
            }
            if (type === 'regions' || type === 'metaregions') {
                delete params.hotel_ids
                setParams((prev) => ({
                    ...prev,
                    to_city: value?.name_en,
                    to_country: value?.iso2
                }));
            }
            if (type === 'hotels') {
                setParams((prev) => ({
                    ...prev,
                    to_city: value?.name_en,
                    to_country: value?.iso2,
                    hotel_ids: [value.id]
                }));
            }
        } else if (key === 'form_date') {
            setParams((prev) => {
                const interval = calculateStayDates(value, getNightCount(prev?.nights));
                return { ...prev, ...interval };
            });
        } else if (key === 'nights') {
            setParams((prev) => {
                const interval = calculateStayDates(prev?.start_date, +value);
                return { ...prev, ...interval, nights: String(value) };
            });
        } else if (key === 'flex_dates') {
            setParams({ ...params, flex_dates: String(value) });
        } else if (key === 'adults') {
            setParams({ ...params, adults: value });
        } else if (key === 'kids') {
            // value is now an object with kids, kids_ages, kids0to3, kids3to12
            if (typeof value === 'object' && value !== null) {
                setParams({
                    ...params,
                    kids: value.kids || '0',
                    kids_ages: value.kids_ages || []
                });
            } else {
                // Fallback for old format
                setParams({ ...params, kids: value, kids_ages: [] });
            }
        }
    };

    const handleSearchTypeChange = (searchType: SearchTypeValue) => {
        setParams((prev) => ({
            ...prev,
            search_type: searchType,
            ...(searchType === 'package' ? { hotel_ids: [] } : {}),
        }));
    };

    const handleClick = () => {
        // If hotel is selected and we're on homepage, navigate to hotel details
        if (params.hotel_ids && params.hotel_ids.length > 0 && pageName === 'home') {
            const hotelId = params.hotel_ids[0];
            
            // Calculate date range for start_date_from and end_date_till
            const startDate = params.start_date || calculateStayDates(new Date(), 7).start_date;
            const nightCount = getNightCount(params.nights);
            const dateRange = calculateStayDates(startDate, nightCount);

            const queryParams: Record<string, string | string[]> = {
                hotel_id: String(hotelId),
                from_city: params.from_city || "Moscow",
                from_country: params.from_country || "RU",
                to_country: params.to_country || "RU",
                to_city: params.to_city || "",
                adults: params.adults || "2",
                start_date: startDate,
                start_date_from: dateRange.start_date_from,
                end_date_till: dateRange.end_date_till,
                nights: params.nights || "7",
                search_type: params.search_type || "package",
                flex_dates: params.flex_dates || "0",
            };

            if (params.kids) {
                queryParams.kids = params.kids;
            }
            if (params.kids_ages && params.kids_ages.length > 0) {
                queryParams.kids_ages = params.kids_ages.map(String);
            }

            router.push({
                pathname: '/hotel-details',
                query: queryParams,
            }, undefined, { shallow: false });
            return;
        }

        const url = createSearchUrl(params);
        startSearch(params);
        router.push(`/search?${url}`);
    };

    const createSearchUrl = (params: SearchParams): string => {
        const queryParams: string[] = [];

        Object.entries(params).forEach(([key, value]) => {
            if (value === undefined || value === null) return;
            if (typeof value === 'string' && value.trim() === '') return;
            if (Array.isArray(value)) {
                if (value.length === 0) return;
                value.forEach((val) => {
                    queryParams.push(`${encodeURIComponent(key)}=${encodeURIComponent(val)}`);
                });
            } else {
                queryParams.push(`${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`);
            }
        });

        return queryParams.join('&');
    };

    const parseSearchParams = (query: Record<string, string | string[]>): Partial<SearchParams> => {
        const parsed: Partial<SearchParams> = {};

        for (const key in query) {
            const value = query[key];

            // Fields that are expected to be arrays
            if (key === 'kids_ages' || key === 'hotel_ids') {
                const arrayValues = Array.isArray(value) ? value : [value];
                parsed[key as keyof SearchParams] = arrayValues.map(Number);
            } else if (key === 'search_type') {
                const raw = Array.isArray(value) ? value[0] : value;
                parsed.search_type = raw === 'hotel' ? 'hotel' : 'package';
            } else {
                // Everything else is a string
                parsed[key as keyof SearchParams] = Array.isArray(value) ? value[0] : value;
            }
        }

        return parsed;
    };

    function formatDateToRussian(dateStr: string) {
        const russianMonths = [
            'января', 'февраля', 'марта', 'апреля', 'мая', 'июня',
            'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря'
        ];

        const [year, month, day] = dateStr.split('-');
        const monthName = russianMonths[parseInt(month, 10) - 1];

        return `${parseInt(day, 10)} ${monthName}`;
    }

  // useEffect(() => {
    //     console.log('searchValue',searchValue);
    //     setHeaderName(searchValue)
    // }, [searchValue]);
    const showSearchForm = pageName === 'search' || pageName === 'home';
    const isHotelSearch = params.search_type === 'hotel';

    return (
        <>
            {showSearchForm && (
                <div className={styles.searchFormBlock}>
                    {!header && (
                        <SearchTypeTabs
                            value={(params.search_type === 'hotel' ? 'hotel' : 'package') as SearchTypeValue}
                            onChange={handleSearchTypeChange}
                        />
                    )}
                    <div className={`${styles.searchForm} ${header && styles.searchFormM}`}>
                        <div className={styles.searchFields}>
                            <WhereTo
                                handleChange={handleChange}
                                name={'to_city'}
                                value={params.to_city}
                                searchType={params.search_type as SearchTypeValue}
                                fromCity={params.from_city}
                            />
                            <div className={styles.searchGroup}>
                                <SelectDate
                                    handleChange={handleChange}
                                    value={params.start_date}
                                    endValue={params.end_date_till}
                                    flexDates={params.flex_dates}
                                />
                                <Nights
                                    handleChange={handleChange}
                                    name={'nights'}
                                    value={params.nights}
                                    flexDates={params.flex_dates}
                                />
                            </div>
                            <People
                                handleChange={handleChange}
                                value={{ adults: params.adults, kids: params.kids, kids_ages: params.kids_ages }}
                                className={isHotelSearch ? styles.whereFrom : undefined}
                            />
                            {!isHotelSearch && (
                                <WhereFrom handleChange={handleChange} name={'from_city'} value={params.from_city} />
                            )}
                        </div>
                        <Button
                            br={16}
                            icon={'search'}
                            title={header ? '' : 'Найти'}
                            onClick={handleClick}
                        />
                    </div>
                </div>
            )}

            {header && (
                <div className={styles.selectdFormM}>
                    <p className={styles.mytextHeader}>{headerName || ''}</p>
                    <p>{formatDateToRussian(params?.start_date)} , {params?.nights} ночей, {parseInt(params?.adults || '0', 10) + parseInt(params?.kids || '0', 10)} туриста</p>
                </div>
            )}
        </>
    );
};

export default SearchForm;
