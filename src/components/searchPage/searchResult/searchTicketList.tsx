import styles from '../searchPage.module.css';
import { useState } from "react";
import TrackPrices from "@/components/UI/trackPrices";
import TicketItem from "@/components/ticketItem";
import SelectedTour from "@/components/selectedTour";


const ResultTicketList = ({flights,packages}:any) => {
    const [priceTrack, setPriceTrack] = useState(false);

    return (
        <div className={styles.resultList}>
            <SelectedTour packages={packages}/>
            <div className={styles.resultListSelectedFilter}>
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
                {flights && flights.length > 0 ? (
                    <div className={styles.resultListSorting}>
                        <p>Найдено {flights?.length}</p>
                    </div>
                ): (
                    <div className={styles.resultListSorting}>
                        <div className={styles.animationTextlazy} style={{width:'30%'}}></div>
                    </div>
                )}

            </div>
            {flights && flights.length > 0 ? (
                <div className={styles.resultListItems}>
                    {flights.map((item, index) => (
                        <>
                            <TicketItem lazy={false} price={packages.price} item={item} green={index === 0}/>
                            {index === 4 && (
                                <TrackPrices text={'Получайте автоматические оповещения при изменении цен.'}
                                             priceTrack={priceTrack} setPriceTrack={setPriceTrack}/>
                            )}
                        </>
                    ))}
                </div>
            ):(
                <div className={styles.resultListItems}>
                    <TicketItem lazy={true} price={0} item={null}/>
                </div>
            )}

        </div>
    );
};

export default ResultTicketList;
