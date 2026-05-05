import styles from '../searchPage.module.css';
import Progress from "@/components/UI/progress";
import HotelCard from "@/components/hotelCard";
import TrackPrices from "@/components/UI/trackPrices";
import { useEffect, useState, useMemo } from "react";
import { useRouter } from 'next/router';
import { useDispatch, useSelector } from 'react-redux';
import { setLoadMore, searchFilters, setAllMyHotels } from '@/store/slices/searchSlice';
import { RootState } from '@/store';
import Select from '@/components/UI/select';
import Icon from "@/components/icons/Icon";
import Button from "@/components/UI/button";

interface ResultListProps {
    tickets?: boolean;
    loading: boolean;
    data?: any;
    setFiltersRequest?: any;
}

const ResultList = ({ tickets, loading, data, setFiltersRequest }: ResultListProps) => {
    const dispatch = useDispatch();
    const router = useRouter();
    const { allMyHotels, hotels } = useSelector((state: RootState) => state.search);
    const [allHotels, setAllHotels] = useState<any[]>([]);
    const [hasMore, setHasMore] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const [priceTrack, setPriceTrack] = useState(false);

    const options = [
        { value: 'relevance', name: 'По рекомендации', icon: 'recomand' },
        { value: 'rating,desc', name: 'Высокий рейтинг', icon: 'reating' },
        // { value: 'rating,asc', name: 'Низкий рейтинг',icon:'cheap' },
        { value: 'price,asc', name: 'Сначала дешёвые', icon: 'cheap' },
        { value: 'price,desc', name: 'Сначала дорогие', icon: 'dear' },
    ];


    // Get selectedFilters from hotels (request_id and readyOperators) - same pattern as filters.tsx
    const selectedFilters = useMemo(() => {
        if (hotels) {
            return {
                request_id: hotels?.request_id,
                readyOperators: hotels?.readyOperators,
            };
        }
        return null;
    }, [hotels]);

    // Get current filter params from hotels object (includes all applied filters)
    // IMPORTANT: Do NOT include sort_by here - we set it explicitly in handleSelect
    const currentFilters = useMemo(() => {
        if (hotels) {
            const filters: any = {
                filter_instant_confirm: hotels?.filter_instant_confirm,
                filter_stars: hotels?.filter_stars,
                filter_meals: hotels?.filter_meals,
                filter_price_min: hotels?.filter_price_min,
                filter_price_max: hotels?.filter_price_max,
            };
            // Explicitly exclude sort_by to prevent it from being overridden
            // We'll set sort_by explicitly in handleSelect
            return filters;
        }
        return {};
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
            page_limit: 20,
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

        const resetParams: any = {
            ...selectedFilters,
            page_limit: 20,
            page_number: 1,
            sort_by: 'relevance',
            filter_instant_confirm: false,
            filter_price_min: hotels?.filters?.prices?.min,
            filter_price_max: hotels?.filters?.prices?.max,
        };

        if (availableStars.length > 0) {
            resetParams.filter_stars = availableStars.join(',');
        }

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

    // Note: Pagination is handled by filters.tsx component, not here
    // This prevents duplicate requests

    // ✅ Handle incoming data and merge into state
    useEffect(() => {
        if (!data?.hotels || data?.hotels.length === 0) return;

        const currentPage = parseInt((router.query.page_number as string) || "1", 10);
        const pageLimit = parseInt((router.query.page_limit as string) || "20", 10);

        let updatedHotels: any[] = [];

        if (currentPage === 1) {
            updatedHotels = data.hotels;
        } else {
            updatedHotels = [...allHotels, ...data.hotels];
        }

        setAllHotels(updatedHotels);
        setHasMore(data.hotels.length === pageLimit);
        setLoadingMore(false);
    }, [data]);

    // ✅ Infinite scroll handler
    useEffect(() => {
        const handleScroll = () => {
            if (loadingMore || !hasMore) return;

            const scrollY = window.scrollY || window.pageYOffset;
            const viewportHeight = window.innerHeight;
            const fullHeight = document.documentElement.scrollHeight;

            if (scrollY + viewportHeight >= fullHeight - 300) {
                loadNextPage();
            }
        };

        window.addEventListener("scroll", handleScroll);
        return () => window.removeEventListener("scroll", handleScroll);
    }, [loadingMore, hasMore, router.query]);


    const loadNextPage = () => {
        if (loadingMore || !hasMore) return;

        const currentPage = parseInt((router.query.page_number as string) || "1", 10);
        const nextPage = currentPage + 1;

        setLoadingMore(true);
        dispatch(setLoadMore(true));
        const queryParams: any = { ...router.query, page_number: nextPage };
        // const sortByToUse = data?.sort_by || selected || router.query.sort_by;
        // if (sortByToUse && sortByToUse !== 'relevance') {
        //     queryParams.sort_by = sortByToUse;
        // }

        router.push(
            {
                pathname: router.pathname,
                query: { ...queryParams },
            },
            undefined,
            { scroll: false }
        );
    };

    return (
        <div className={styles.resultList}>
            <Progress title={'Ищем подходящие туры'} loading={loading} />

            {loading && (
                <div className={styles.resultListSorting}>
                    <div className={styles.animationTextlazy} style={{ width: '30%', height: '16px' }}></div>
                </div>
            )}

            {!loading && (
                <div className={styles.resultListSorting}>
                    <p>Найдено {data?.hotels_count || 0} отеля</p>
                    <Select
                        type={'designMob'}
                        options={options}
                        value={options.find(opt => opt.value === data?.sort_by)?.name || data?.sort_by || ''}
                        onChange={handleSelect}
                        label={'Сортировка'}
                        placeholder="По рекомендации" />
                </div>
            )}

            <div className={styles.resultListItems}>
                {loading && (
                    <>
                        <HotelCard lazy request_id={data?.request_id} item={null} />
                        <HotelCard lazy request_id={data?.request_id} item={null} />
                        <HotelCard lazy request_id={data?.request_id} item={null} />
                    </>
                )}

                {allMyHotels?.map((item, index) => (
                    <div key={item.id}>
                        <HotelCard request_id={data?.request_id} item={item} />
                        {index === 4 && (
                            <TrackPrices
                                text={'Получайте автоматические оповещения при изменении цен.'}
                                priceTrack={priceTrack}
                                setPriceTrack={setPriceTrack}
                            />
                        )}
                    </div>
                ))}

                {!loading && (allMyHotels?.length || 0) === 0 && (
                    <div className={styles.emptyState}>
                        <div className={styles.emptyStateIconWrap}>
                            <Icon name="tourist" size={80} color="var(--core_Orange)" />
                        </div>
                        <h3 className={styles.emptyStateTitle}>Ошибка</h3>
                        <p className={styles.emptyStateText}>
                            К сожалению, не найдено ни одного тура, соответствующего вашим критериям.
                            Пожалуйста, попробуйте изменить параметры поиска или вернитесь позже.
                        </p>
                        <Button title={'Сбросить фильтры'} onClick={handleResetFilters} />
                    </div>
                )}
            </div>

            {loadingMore && (
                <p style={{ textAlign: 'center', padding: '10px' }}>
                    Загрузка...
                </p>
            )}
        </div>
    );
};

export default ResultList;












// import styles from '../searchPage.module.css';
// import Progress from "@/components/UI/progress";
// import Tag from "@/components/UI/tag";
// import {useEffect, useMemo, useState} from "react";
// import Select from "@/components/UI/select";
// import HotelCard from "@/components/hotelCard";
// import TrackPrices from "@/components/UI/trackPrices";
// import {useRouter} from 'next/router';
//
// interface FilterItem {
//     id: number;
//     name: string;
//     active: boolean;
//
// }
// interface ResultListProps {
//     tickets?:boolean
//     loading:boolean
//     data?:any
// }
//
// const ResultList = ({tickets,loading,data}:ResultListProps) => {
//     const router = useRouter();
//     const [allHotels, setAllHotels] = useState<any[]>([]);
//
//     useEffect(() => {
//         const currentPage = parseInt((router.query.page_number as string) || "1", 10);
//
//         if (data) {
//             if (currentPage > 1) {
//                 // concat with old hotels
//                 setAllHotels((prev) => [...prev, ...data.hotels]);
//             } else {
//                 // replace (first page)
//                 setAllHotels(data.hotels);
//             }
//         }
//     }, [data, router.query.page_number]);
//
//
//     const resultData = useMemo(() => {
//         return allHotels;
//     }, [allHotels]);
//
//
//     const [filters, setFilters] = useState<FilterItem[]>([
//         // { id: 1, name: 'Быстрое подтверждение', active: true },
//         // { id: 2, name: '1-я линия', active: true },
//         // { id: 3, name: 'Тип размещения', active: true },
//         // { id: 4, name: 'от 4 звёзд', active: false },
//         // { id: 5, name: 'Рейтинг: 4+', active: false },
//         // { id: 6, name: 'Всё включено', active: false }
//     ]);
//     const [selected, setSelected] = useState(null);
//     const [priceTrack, setPriceTrack] = useState(false);
//
//     const options = [{value:'RUB',name:'По рекомендации'},{value:'USD',name:'Высокий рейтинг'},{value:'low',name:'Сначала дешёвые'},{value:'low',name:'Сначала дорогие'}];
//
//     const handleFilterToggle = (id: number) => {
//         setFilters(prev =>
//             prev.map(filter =>
//                 filter.id === id ? { ...filter, active: !filter.active } : filter
//             )
//         );
//     };
//
//     const removeAll =()=>{
//
//     }
//
//     const handleShowMore = () => {
//         // Get current page_number from query or default to 1
//         const currentPage = parseInt((router.query.page_number as string) || "1", 10);
//         const nextPage = currentPage + 1;
//
//         // Keep existing query params, just update page_number
//         const newQuery = {
//             ...router.query,
//             page_number: nextPage,
//         };
//
//         router.push(
//             {
//                 pathname: router.pathname,
//                 query: newQuery,
//             },
//             undefined,
//             { scroll: false } // 👈 this prevents auto scroll to top
//         );
//     };
//
//     return (
//         <div className={styles.resultList}>
//             <Progress title={'Ищем подходящие туры'} loading={loading} />
//             {!loading  && (
//             <div className={styles.resultListSelectedFilter}>
//                 {/*{filters.length > 0 &&(*/}
//                 {/*<div className={styles.selectedFiltersList}>*/}
//                 {/*    {filters.map((item) => (*/}
//                 {/*        <Tag*/}
//                 {/*            key={item.id}*/}
//                 {/*            title={item.name}*/}
//                 {/*            active={item.active}*/}
//                 {/*            onClick={() => handleFilterToggle(item.id)}*/}
//                 {/*        />*/}
//                 {/*    ))}*/}
//
//                 {/*        <Tag*/}
//                 {/*            key={12345}*/}
//                 {/*            title={'Очистить все'}*/}
//                 {/*            active={false}*/}
//                 {/*            onClick={() => removeAll()}*/}
//                 {/*            icon={'trash'}*/}
//                 {/*        />*/}
//
//                 {/*</div>*/}
//                 {/*    )}*/}
//
//                     <div className={styles.resultListSorting}>
//                         <p>Найдено {data?.hotels_count || 0} отеля</p>
//                         {/*<Select*/}
//                         {/*    type={'designMob'}*/}
//                         {/*    options={options}*/}
//                         {/*    value={selected}*/}
//                         {/*    onChange={setSelected}*/}
//                         {/*    label={'Сортировка'}*/}
//                         {/*    placeholder="По рекомендации"/>*/}
//                     </div>
//
//             </div>
//                     )}
//             {/*{tickets ? (*/}
//             <div className={styles.resultListItems}>
//                 {loading && (
//                     <>
//                         <HotelCard lazy={true}  request_id={data?.request_id} item={null}/>
//                         <HotelCard lazy={true}  request_id={data?.request_id} item={null}/>
//                         <HotelCard lazy={true}  request_id={data?.request_id} item={null}/>
//                     </>
//                 )}
//
//                 {resultData.map((item, index) => (
//                     <>
//                         <HotelCard  key={item.id} request_id={data?.request_id} item={item}/>
//                         {index === 4 && (
//                             <TrackPrices text={'Получайте автоматические оповещения при изменении цен.'}
//                                          priceTrack={priceTrack} setPriceTrack={setPriceTrack}/>
//                             )}
//                         </>
//                     ))}
//                 </div>
//                 <div onClick={()=>handleShowMore()}>
//                     <p>Show more</p>
//                 </div>
//             {/*    ):(*/}
//             {/*    <div className={styles.resultListItems}>*/}
//             {/*        {Array.from({ length: 13 }).map((item,index) => (*/}
//             {/*            <>*/}
//             {/*                <HotelCard key={item.tour_id} item={item} />*/}
//             {/*                {index === 4 && (*/}
//             {/*                    <TrackPrices text={'Получайте автоматические оповещения при изменении цен.'} priceTrack={priceTrack} setPriceTrack={setPriceTrack}/>*/}
//             {/*                )}*/}
//             {/*            </>*/}
//             {/*        ))}*/}
//             {/*    </div>*/}
//             {/*)}*/}
//
//         </div>
//     );
// };
//
// export default ResultList;
