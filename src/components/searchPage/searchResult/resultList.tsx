import styles from '../searchPage.module.css';
import Progress from "@/components/UI/progress";
import HotelCard from "@/components/hotelCard";
import TrackPrices from "@/components/UI/trackPrices";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from 'next/router';

interface ResultListProps {
    tickets?: boolean;
    loading: boolean;
    data?: any;
}

const ResultList = ({ tickets, loading, data }: ResultListProps) => {
    const router = useRouter();
    const [allHotels, setAllHotels] = useState<any[]>([]);
    const [hasMore, setHasMore] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const [priceTrack, setPriceTrack] = useState(false);

    // Update hotels when new data arrives
    useEffect(() => {
        const currentPage = parseInt((router.query.page_number as string) || "1", 10);

        if (data?.hotels?.length) {
            if (currentPage > 1) {
                setAllHotels((prev) => [...prev, ...data.hotels]);
            } else {
                setAllHotels(data.hotels);
            }

            const pageLimit = parseInt((router.query.page_limit as string) || "20", 10);
            setHasMore(data.hotels.length === pageLimit);
        }

        setLoadingMore(false);
    }, [data, router.query.page_number]);

    const resultData = useMemo(() => allHotels, [allHotels]);

    // Scroll listener for infinite load
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
        router.push(
            {
                pathname: router.pathname,
                query: { ...router.query, page_number: nextPage },
            },
            undefined,
            { scroll: false }
        );
    };

    return (
        <div className={styles.resultList}>
            <Progress title={'Ищем подходящие туры'} loading={loading} />

            {!loading && (
                <div className={styles.resultListSorting}>
                    <p>Найдено {data?.hotels_count || 0} отеля</p>
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

                {resultData.map((item, index) => (
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
            </div>

            {loadingMore && <p style={{ textAlign: 'center', padding: '10px' }}>Загрузка...</p>}
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
