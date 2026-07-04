import styles from '../hotelDetails.module.css';
import Button from "@/components/UI/button";
import { useRouter } from "next/router";
import React from "react";
import {createPackage} from "@/api/levelTravelApi";
import {
    getOfferPriceSubtitle,
    getSearchTypeFromQuery,
    navigateAfterPackageCreate,
} from "@/utils/bookingFlowUtils";
import { formatPriceRub } from '@/utils/formatPrice';

interface RoomItem {
    date: string;
    tourAgent: string;
    price: string | number;
}

interface HotelDetailsItem {
    title: string;
    description: string;
    items: RoomItem[];
}

interface HotelDetailsPriceListProps {
    item: HotelDetailsItem;
    type:string;
    selectedDate:any;
    selectedOperator:any
}

const HotelDetailsPriceList: React.FC<HotelDetailsPriceListProps> = ({ item,selectedDate,selectedOperator,type }) => {
    const router = useRouter();
    const searchType = getSearchTypeFromQuery(router.query);

    const handleBook =async (id) => {
      const res =  await createPackage({request_id:router.query.request_id,tour_id:id})
        navigateAfterPackageCreate(router, res.package.id, searchType);
    };

    const formatDate = (dateStr) => {
        const [year, month, day] = dateStr.split('-');
        return `С ${day}.${month}`;
    };
    const roomTypeName= {
        BB:'Завтрак',
        RO:'Без питания',
        AI:'Всё включено',
        UAI:'Ультра всё включено',
        HB:'Завтрак и ужин',
        FB:'Завтрак, обед, ужин',
        HBD:'Завтрак и ужин',
        AI24:'Всё включено 24 часа',
        DNR:'Ужин',
        AIL:'Всё включено с ограничениями',
        'FB+':'Завтрак, обед, ужин +',
        'HB+':'Завтрак и ужин +',
        HBL:'Завтрак и обед'
    }

    return (
        <div className={styles.HotelDetailsPriceList}>
            <div className={styles.HotelDetailsPriceListHead}>
                <p>{roomTypeName?.[type]}</p>
                {item?.description?.length > 1 && <p>{item?.description}</p>}
            </div>
            <div className={styles.HotelDetailsPriceListItems}>
                {item?.map((room, index) =>
                    room.operator_id === selectedOperator ? (
                    <div key={index} className={styles.HotelDetailsPriceListItem}>
                        <div>
                            <p>{room.nights_count} ночей  {formatDate(room?.start_date)}</p>
                            <p>{room?.operator_name}</p>
                        </div>
                        <div>
                            <p>{formatPriceRub(room?.price)}</p>
                            <p>{getOfferPriceSubtitle(searchType)}</p>
                        </div>
                        <div className={styles.mobButton}>
                            <Button
                                onClick={()=>handleBook(room.id)}
                                width="148px"
                                height="40px"
                                full={false}
                                title="Выбрать"
                            />
                        </div>
                    </div>
                ):null)}
            </div>
        </div>
    );
};

export default HotelDetailsPriceList;
