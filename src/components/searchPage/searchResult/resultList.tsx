import styles from '../searchPage.module.css';
import Progress from "@/components/UI/progress";
import HotelCard from "@/components/hotelCard";
import { useEffect, useState, useMemo, useRef, useCallback } from "react";
import { useRouter } from 'next/router';
import { useDispatch, useSelector } from 'react-redux';
import { setLoadMore, searchFilters, setAllMyHotels } from '@/store/slices/searchSlice';
import { getHotelListItemKey, getNextPageNumber, hasMoreHotelResults, parseUiPageNumber, toOperatorIdsCsv } from '@/utils/searchResults';
import { RootState } from '@/store';
import Select from '@/components/UI/select';
import Icon from "@/components/icons/Icon";
import Button from "@/components/UI/button";
import { pickAppliedFiltersFromHotels, replaceSearchListFilters } from '@/utils/searchListState';
import SelectedFilters from './selectedFilters';
import { buildRemoveChipParams, type FilterChip } from '@/utils/filterChips';

interface ResultListProps {
    tickets?: boolean;
    loading: boolean;
    data?: any;
    setFiltersRequest?: any;
}

const PAGE_LIMIT = 50;

const ResultList = ({ tickets, loading, data, setFiltersRequest }: ResultListProps) => {
    const dispatch = useDispatch();
    const router = useRouter();
    const { allMyHotels, hotels, loadMore, loading: storeLoading, error, startSearchValid } = useSelector(
        (state: RootState) => state.search,
    );
    const isLoading = loading ?? storeLoading;

    const hasSearchQuery = useMemo(() => {
        if (!router.isReady) return false;
        const q = router.query;
        const keys = ['to_city', 'to_country', 'from_city', 'start_date', 'hotel_ids'];
        return keys.some((key) => {
            const value = q[key];
            if (Array.isArray(value)) return value.length > 0 && String(value[0]).trim() !== '';
            return value != null && String(value).trim() !== '';
        });
    }, [router.isReady, router.query]);

    const hasSearchFinished = hotels != null;
    const expectsSearch = hasSearchQuery || !startSearchValid;
    const isSearching = isLoading || (expectsSearch && !hasSearchFinished && !error);

    // Show skeletons only for a fresh search/filter/sort, not while appending more results.
    const showSkeleton = isSearching && !loadMore;
    const loadMoreRef = useRef(false);
    /** Last successfully requested UI page (1-based). Load-more always does +1. */
    const lastUiPageRef = useRef(1);
    const sentinelRef = useRef<HTMLDivElement | null>(null);

    const totalHotelsCount = Number(data?.hotels_count ?? hotels?.hotels_count ?? 0);
    const shownHotelsCount = allMyHotels?.length ?? 0;
    const lastPageSize = Number(data?.hotels?.length ?? hotels?.hotels?.length ?? 0);
    const hasMore = hasMoreHotelResults({
        shownCount: shownHotelsCount,
        totalCount: totalHotelsCount,
        lastPageSize,
        pageLimit: PAGE_LIMIT,
    });
    const isLoadingMore = loadMore && storeLoading;

    const options = [
        { value: 'relevance', name: 'По рекомендации', icon: 'recomand' },
        { value: 'rating,desc', name: 'Высокий рейтинг', icon: 'reating' },
        // { value: 'rating,asc', name: 'Низкий рейтинг',icon:'cheap' },
        { value: 'price,asc', name: 'Сначала дешёвые', icon: 'cheap' },
        { value: 'price,desc', name: 'Сначала дорогие', icon: 'dear' },
    ];


    // Get selectedFilters from hotels (request_id and readyOperators) - same pattern as filters.tsx
    const selectedFilters = useMemo(() => {
        if (hotels?.request_id) {
            const operators = toOperatorIdsCsv(hotels?.readyOperators);
            return {
                request_id: hotels.request_id,
                ...(operators ? { readyOperators: operators } : {}),
            };
        }
        return null;
    }, [hotels?.request_id, hotels?.readyOperators]);

    // Get current filter params from hotels object (includes all applied filters)
    // IMPORTANT: Do NOT include sort_by here - we set it explicitly in handleSelect
    const currentFilters = useMemo(() => {
        if (!hotels) return {};
        const applied = pickAppliedFiltersFromHotels(hotels as Record<string, unknown>);
        const { sort_by: _sortBy, ...rest } = applied;
        // Omit amenity filters that are off — only keep true / non-empty values.
        const cleaned: Record<string, unknown> = {};
        Object.entries(rest).forEach(([key, value]) => {
            if (value === undefined || value === null) return;
            if (typeof value === 'string' && value.trim() === '') return;
            if (value === false && key !== 'filter_instant_confirm') return;
            cleaned[key] = value;
        });
        return cleaned;
    }, [hotels]);


    const handleSelect = (optionName: string) => {
        // Select component passes option.name (display text like "Сначала дорогие") as a STRING, not an object
        // So we need to find the option by name and get its value (like "price,desc")
        const trimmedName = optionName?.trim();
        const selectedOption = options.find(opt => opt.name.trim() === trimmedName);

        if (!selectedOption) {
            return;
        }

        const sortValue = selectedOption.value; // This will be "price,desc", "price,asc", etc.

        // Double-check that we have a valid value
        if (!sortValue || sortValue === optionName) {
            return;
        }

        // For tickets: use setFiltersRequest (like filtersPackage.tsx)
        if (tickets && setFiltersRequest && typeof setFiltersRequest === 'function') {
            setFiltersRequest({ sort_by: sortValue });
            return;
        }

        // For hotels: use Redux searchFilters (like filters.tsx)
        if (!selectedFilters || !sortValue) return;

        // Include all current filter params when changing sort (same pattern as filters.tsx)
        // Build paramsFilter and explicitly set sort_by to ensure it's the value, not the name
        const paramsFilter: any = {
            ...currentFilters, // Include all current filter params (excludes sort_by)
            ...selectedFilters, // Include request_id and readyOperators
            page_limit: 50,
            page_number: 1,
        };

        paramsFilter.sort_by = sortValue;

        dispatch(setAllMyHotels([]));

        // Dispatch the search with sort filter
        dispatch(searchFilters(paramsFilter) as any);

        // Update URL with sort_by parameter and reset page number
        router.push(
            {
                pathname: router.pathname,
                query: { ...router.query, sort_by: sortValue, page_number: 1 },
            },
            undefined,
            { scroll: false }
        );
    };

    const handleResetFilters = () => {
        if (!selectedFilters) return;

        const availableStars = (hotels?.filters?.stars || [])
            .map((star: any) => star?.id)
            .filter((id: any) => id !== null && id !== undefined && String(id) !== '0');

        const resetParams: Record<string, unknown> = {
            ...selectedFilters,
            page_limit: 50,
            page_number: 1,
            sort_by: 'relevance',
            filter_instant_confirm: false,
            filter_price_min: hotels?.filters?.prices?.min,
            filter_price_max: hotels?.filters?.prices?.max,
        };

        if (availableStars.length > 0) {
            resetParams.filter_stars = availableStars.join(',');
        }

        // Сбросить и сессионный снимок — иначе сайдбар восстановит старые удобства из sessionStorage.
        const { request_id: _rid, readyOperators: _ro, page_limit: _pl, page_number: _pn, ...resetFilters } = resetParams;
        replaceSearchListFilters(resetFilters, String(selectedFilters.request_id));

        dispatch(setAllMyHotels([]));
        dispatch(searchFilters(resetParams) as any);

        router.push(
            {
                pathname: router.pathname,
                query: { ...router.query, page_number: 1, sort_by: 'relevance' },
            },
            undefined,
            { scroll: false }
        );
    };

    // Снять один тег над списком: те же параметры, что у сортировки, плюс переопределение из тега.
    // '' для CSV-фильтра и false для удобства сохраняются намеренно — так очищенный фильтр
    // не подменяется дефолтом (см. sanitizeListingFilterParams); getGroupedHotels их не отправляет.
    const handleRemoveChip = (chip: FilterChip) => {
        if (!selectedFilters || tickets) return;

        const sortBy =
            (router.query.sort_by as string) ||
            data?.sort_by ||
            hotels?.sort_by ||
            'relevance';

        const overrides = buildRemoveChipParams(hotels, chip);
        const paramsFilter: Record<string, unknown> = {
            ...currentFilters,
            ...selectedFilters,
            ...overrides,
            page_limit: PAGE_LIMIT,
            page_number: 1,
            sort_by: sortBy,
        };

        // Сессионный снимок фильтров — как в filters.tsx (dispatchFilterSearch): '' сохраняем,
        // выключенное удобство удаляем, чтобы сайдбар и возврат со страницы отеля не вернули его.
        const sessionFilters = pickAppliedFiltersFromHotels({ ...hotels, ...overrides }) as Record<string, unknown>;
        Object.entries(overrides).forEach(([key, value]) => {
            if (typeof value === 'string' && value.trim() === '') sessionFilters[key] = '';
            else if (value === false && key !== 'filter_instant_confirm') delete sessionFilters[key];
        });
        replaceSearchListFilters(sessionFilters, String(selectedFilters.request_id));

        dispatch(setAllMyHotels([]));
        dispatch(searchFilters(paramsFilter) as any);

        router.push(
            {
                pathname: router.pathname,
                query: { ...router.query, page_number: 1 },
            },
            undefined,
            { scroll: false }
        );
    };

    const buildFilterParams = useCallback(
        (pageNumber: number) => {
            const sortBy =
                (router.query.sort_by as string) ||
                data?.sort_by ||
                currentFilters?.sort_by ||
                'relevance';

            return {
                ...currentFilters,
                ...selectedFilters,
                page_limit: PAGE_LIMIT,
                page_number: parseUiPageNumber(pageNumber),
                sort_by: sortBy,
            };
        },
        [router.query.sort_by, data?.sort_by, currentFilters, selectedFilters],
    );

    const loadNextPage = useCallback(() => {
        if (
            loadMoreRef.current ||
            storeLoading ||
            !hasMore ||
            !selectedFilters?.request_id ||
            tickets
        ) {
            return;
        }

        // Explicit cursor: always request the next UI page after the last one loaded.
        // (Deriving only from shownCount/50 got stuck when append failed or page was partial.)
        const fromCount = getNextPageNumber(shownHotelsCount, PAGE_LIMIT);
        const nextPage = Math.max(lastUiPageRef.current + 1, fromCount);

        loadMoreRef.current = true;
        lastUiPageRef.current = nextPage;

        dispatch(setLoadMore(true));
        dispatch(searchFilters(buildFilterParams(nextPage)) as any);
    }, [
        storeLoading,
        hasMore,
        selectedFilters,
        tickets,
        shownHotelsCount,
        dispatch,
        buildFilterParams,
    ]);

    useEffect(() => {
        if (!storeLoading) {
            loadMoreRef.current = false;
        }
    }, [storeLoading]);

    // New search / filter page-1 replace → reset pagination cursor.
    useEffect(() => {
        lastUiPageRef.current = 1;
        loadMoreRef.current = false;
    }, [hotels?.request_id]);

    useEffect(() => {
        if (storeLoading || loadMore) return;
        const uiPage = parseUiPageNumber(hotels?.ui_page_number);
        if (uiPage <= 1) {
            lastUiPageRef.current = 1;
        } else {
            lastUiPageRef.current = Math.max(lastUiPageRef.current, uiPage);
        }
    }, [storeLoading, loadMore, hotels?.ui_page_number, hotels?.request_id]);

    // Restore scroll after returning from hotel details.
    useEffect(() => {
        if (showSkeleton || isLoading) return;
        const raw = sessionStorage.getItem('searchScroll');
        if (!raw) return;
        const y = Number(raw);
        sessionStorage.removeItem('searchScroll');
        if (!Number.isFinite(y) || y <= 0) return;
        requestAnimationFrame(() => {
            window.scrollTo(0, y);
        });
    }, [showSkeleton, isLoading, hotels?.request_id]);

    useEffect(() => {
        if (!hasMore || showSkeleton || isLoadingMore) return;

        const sentinel = sentinelRef.current;
        if (!sentinel) return;

        const observer = new IntersectionObserver(
            (entries) => {
                if (entries[0]?.isIntersecting) {
                    loadNextPage();
                }
            },
            { rootMargin: '300px 0px' },
        );

        observer.observe(sentinel);
        return () => observer.disconnect();
    }, [hasMore, showSkeleton, isLoadingMore, loadNextPage]);

    const showEmptyState =
        !isLoading && hasSearchFinished && !error && (allMyHotels?.length || 0) === 0;
    const showErrorState = !isLoading && !!error;

    return (
        <div className={styles.resultList}>
            <Progress title={'Ищем подходящие туры'} loading={isSearching} />

            {isSearching && (
                <div className={styles.resultListSorting}>
                    <div className={styles.animationTextlazy} style={{ width: '30%', height: '16px' }}></div>
                </div>
            )}

            {!isSearching && hasSearchFinished && (
                <div className={styles.resultListSelectedFilter}>
                    {!tickets && (
                        <SelectedFilters
                            hotels={hotels}
                            disabled={storeLoading}
                            onRemove={handleRemoveChip}
                            onReset={handleResetFilters}
                        />
                    )}
                    <div className={styles.resultListSorting}>
                        <p>
                            {hasMore
                                ? `Показано ${shownHotelsCount} из ${totalHotelsCount} отелей`
                                : `Найдено ${totalHotelsCount} отелей`}
                        </p>
                        <Select
                            type={'designMob'}
                            options={options}
                            value={options.find(opt => opt.value === data?.sort_by)?.name || data?.sort_by || ''}
                            onChange={handleSelect}
                            label={'Сортировка'}
                            placeholder="По рекомендации" />
                    </div>
                </div>
            )}

            <div className={styles.resultListItems}>
                {showSkeleton && (
                    <>
                        <HotelCard lazy request_id={data?.request_id} item={null} />
                        <HotelCard lazy request_id={data?.request_id} item={null} />
                        <HotelCard lazy request_id={data?.request_id} item={null} />
                    </>
                )}

                {!showSkeleton && !showErrorState && allMyHotels?.map((item, index) => (
                    <div key={getHotelListItemKey(item) ?? `hotel-${index}`}>
                        <HotelCard request_id={data?.request_id ?? hotels?.request_id} item={item} />
                    </div>
                ))}

                {showErrorState && (
                    <div className={styles.emptyState}>
                        <div className={styles.emptyStateIconWrap}>
                            <Icon name="tourist" size={80} color="var(--core_Orange)" />
                        </div>
                        <h3 className={styles.emptyStateTitle}>Ошибка</h3>
                        <p className={styles.emptyStateText}>
                            Не удалось загрузить туры. Пожалуйста, попробуйте изменить параметры поиска
                            или повторите попытку позже.
                        </p>
                        <Button title={'Сбросить фильтры'} onClick={handleResetFilters} />
                    </div>
                )}

                {showEmptyState && (
                    <div className={styles.emptyState}>
                        <div className={styles.emptyStateIconWrap}>
                            <Icon name="tourist" size={80} color="var(--core_Orange)" />
                        </div>
                        <h3 className={styles.emptyStateTitle}>Туры не найдены</h3>
                        <p className={styles.emptyStateText}>
                            К сожалению, не найдено ни одного тура, соответствующего вашим критериям.
                            Пожалуйста, попробуйте изменить параметры поиска или вернитесь позже.
                        </p>
                        <Button title={'Сбросить фильтры'} onClick={handleResetFilters} />
                    </div>
                )}
            </div>

            {hasMore && !showSkeleton && !showErrorState && (
                <div className={styles.loadMoreSection}>
                    <Button
                        title={isLoadingMore ? 'Загрузка...' : 'Показать ещё'}
                        onClick={loadNextPage}
                        disabled={isLoadingMore}
                    />
                    <div ref={sentinelRef} className={styles.loadMoreSentinel} aria-hidden />
                </div>
            )}
        </div>
    );
};

export default ResultList;
