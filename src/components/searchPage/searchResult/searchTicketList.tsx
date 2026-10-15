import styles from '../searchPage.module.css';
import tl from './ticketList.module.css';
import TicketItem from "@/components/ticketItem";
import SelectedTour from "@/components/selectedTour";
import Progress from '@/components/UI/progress';
import { pluralizeRu } from '@/utils/formatRussianPlural';
import Button from '@/components/UI/button';
import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * Перелёты к туру показываются частями: сначала TICKETS_PAGE_SIZE карточек, следующие —
 * при прокрутке к концу списка (IntersectionObserver) или по кнопке «Показать ещё».
 * Весь ответ /packages/flights по-прежнему один (API и приложение не меняются): цена «от»
 * в SelectedTour, счётчик и бронирование считают по полному списку, режется только отрисовка.
 */
export const TICKETS_PAGE_SIZE = 20;

const flightKey = (item: any, index: number) => item?.flight_pair_id ?? `flight-${index}`;

const ResultTicketList = ({ flights, packages, loading }: any) => {
    const flightsCount = flights?.length ?? 0;
    const [visibleCount, setVisibleCount] = useState(TICKETS_PAGE_SIZE);
    const sentinelRef = useRef<HTMLDivElement | null>(null);

    // Новый список (фильтр, обновление пакета) — снова с первой части.
    useEffect(() => {
        setVisibleCount(TICKETS_PAGE_SIZE);
    }, [flights]);

    const shownCount = Math.min(visibleCount, flightsCount);
    const hasMore = !loading && shownCount < flightsCount;

    const showMore = useCallback(() => {
        setVisibleCount((count) => Math.min(count + TICKETS_PAGE_SIZE, flightsCount));
    }, [flightsCount]);

    useEffect(() => {
        if (!hasMore) return;
        const sentinel = sentinelRef.current;
        if (!sentinel || typeof window === 'undefined' || typeof window.IntersectionObserver === 'undefined') return;
        const observer = new window.IntersectionObserver(
            (entries) => {
                if (entries[0]?.isIntersecting) showMore();
            },
            { rootMargin: '300px 0px' },
        );
        observer.observe(sentinel);
        return () => observer.disconnect();
    }, [hasMore, showMore, shownCount]);

    return (
        <div className={styles.resultList}>
            <Progress title={'Ищем подходящие варианты перелёта'} loading={loading} />

            <div className={tl.tour}>
                <SelectedTour packages={packages} flights={flights} />
            </div>
            <div className={`${styles.resultListSelectedFilter} ${tl.countRow}`}>
                {/*<div className={styles.selectedFiltersList}>*/}
                {/*    {filters.map((item) => (*/}
                {/*        <Tag*/}
                {/*            key={item.id}*/}
                {/*            title={item.name}*/}
                {/*            active={item.active}*/}
                {/*            onClick={() => handleFilterToggle(item.id)}*/}
                {/*        />*/}
                {/*    ))}*/}
                {/*    <Tag*/}
                {/*        key={12345}*/}
                {/*        title={'Очистить все'}*/}
                {/*        active={false}*/}
                {/*        onClick={() => removeAll()}*/}
                {/*        icon={'trash'}*/}
                {/*    />*/}
                {/*</div>*/}
                {flightsCount > 0 ? (
                    <div className={styles.resultListSorting}>
                        <p>
                            {hasMore
                                ? `Показано ${shownCount} из ${flightsCount} ${pluralizeRu(flightsCount, ['варианта', 'вариантов', 'вариантов'])}`
                                : `Найдено ${flightsCount} ${pluralizeRu(flightsCount, ['вариант', 'варианта', 'вариантов'])}`}
                        </p>
                    </div>
                ) : (
                    <div className={styles.resultListSorting}>
                        <div className={styles.animationTextlazy} style={{ width: '30%' }}></div>
                    </div>
                )}

            </div>
            <div className={`${styles.resultListItems} ${tl.items}`}>
                {loading && (
                    <>
                        <TicketItem lazy={true} price={0} item={null} green={true} />
                        <TicketItem lazy={true} price={0} item={null} />
                        <TicketItem lazy={true} price={0} item={null} />
                    </>
                )}

                {!loading && flights && flights.length > 0 && (
                    <>
                        {flights.slice(0, shownCount).map((item, index) => (
                            <TicketItem key={flightKey(item, index)} lazy={false} price={packages.price} item={item} green={index === 0} />
                        ))}
                    </>
                )}
            </div>

            {hasMore && (
                <div className={styles.loadMoreSection}>
                    <Button title={'Показать ещё'} onClick={showMore} />
                    <div ref={sentinelRef} className={styles.loadMoreSentinel} aria-hidden />
                </div>
            )}

        </div>
    );
};

export default ResultTicketList;
