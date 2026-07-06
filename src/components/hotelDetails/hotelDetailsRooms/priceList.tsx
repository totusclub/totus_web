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
import { getOfferConfirmabilityDisplayLabel } from '@/utils/roomFilters';
import { getOfferDisplayInfo, OFFER_TAG_BEST_PRICE } from '@/utils/offerDisplay';
import Icon from '@/components/icons/Icon';

interface HotelDetailsPriceListProps {
    item: any[];
    type: string;
    selectedDate: any;
}

const HotelDetailsPriceList: React.FC<HotelDetailsPriceListProps> = ({ item, type }) => {
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
                {item
                    ?.filter((room) => room.type === type)
                    .map((room) => {
                        const confirmabilityLabel = getOfferConfirmabilityDisplayLabel(room);
                        const displayInfo = getOfferDisplayInfo(room);
                        const secondaryTags = displayInfo.tags.filter(
                            (tag) => tag !== confirmabilityLabel,
                        );
                        const hasBestPrice = secondaryTags.includes(OFFER_TAG_BEST_PRICE);
                        const otherTags = secondaryTags.filter(
                            (tag) => tag !== OFFER_TAG_BEST_PRICE,
                        );

                        return (
                    <div key={room.id} className={styles.HotelDetailsPriceListItem}>
                        <div>
                            <p className={styles.HotelDetailsPriceListItemMeta}>
                                {hasBestPrice ? (
                                    <span className={styles.HotelDetailsOfferBestPriceBadge}>
                                        <span className={styles.HotelDetailsOfferBestPriceIcon}>
                                            <Icon name="star" size={10} color="#FFFFFF" />
                                        </span>
                                        <span className={styles.HotelDetailsOfferBestPriceText}>
                                            {OFFER_TAG_BEST_PRICE}
                                        </span>
                                    </span>
                                ) : null}
                                <span>
                                    {room.nights_count} ночей  {formatDate(room?.start_date)}
                                </span>
                            </p>
                            <p>{room?.operator_name}</p>
                            {confirmabilityLabel ? (
                                <p className={styles.HotelDetailsOfferConfirmability}>
                                    {confirmabilityLabel}
                                </p>
                            ) : null}
                            {otherTags.length > 0 ? (
                                <div className={styles.HotelDetailsOfferTags}>
                                    {otherTags.map((tag) => (
                                        <span key={tag} className={styles.HotelDetailsOfferTag}>
                                            {tag}
                                        </span>
                                    ))}
                                </div>
                            ) : null}
                        </div>
                        <div className={styles.HotelDetailsPriceListPriceCol}>
                            <div className={styles.HotelDetailsPriceListPriceBlock}>
                                <p className={styles.HotelDetailsPriceListPriceValue}>
                                    {formatPriceRub(room?.price)}
                                </p>
                                <p>{getOfferPriceSubtitle(searchType)}</p>
                                {room.price_per_night ? (
                                    <p className={styles.HotelDetailsOfferPerNight}>
                                        {formatPriceRub(room.price_per_night)} / ночь
                                    </p>
                                ) : null}
                            </div>
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
                        );
                    })}
            </div>
        </div>
    );
};

export default HotelDetailsPriceList;
