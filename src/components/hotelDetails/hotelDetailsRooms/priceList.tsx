import styles from '../hotelDetails.module.css';
import Button from "@/components/UI/button";
import { useRouter } from "next/router";
import React, { useMemo, useState } from "react";
import {createPackage} from "@/api/levelTravelApi";
import {
    getOfferPriceSubtitle,
    getSearchTypeFromQuery,
    navigateAfterPackageCreate,
} from "@/utils/bookingFlowUtils";
import { formatPriceRub } from '@/utils/formatPrice';
import { getOfferConfirmabilityDisplayLabel } from '@/utils/roomFilters';
import { getOfferDisplayInfo, OFFER_TAG_BEST_PRICE } from '@/utils/offerDisplay';
import {
    getOfferPrice,
    OFFER_GROUP_ORDER,
    splitOffersBySource,
    type OfferSource,
} from '@/utils/roomOffers';
import Icon from '@/components/icons/Icon';

interface HotelDetailsPriceListProps {
    item: any[];
    type: string;
    selectedDate: any;
}

const roomTypeName: Record<string, string> = {
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
};

type OfferGroup = { source: OfferSource; offers: any[] };

const HotelDetailsPriceList: React.FC<HotelDetailsPriceListProps> = ({ item, type }) => {
    const router = useRouter();
    const searchType = getSearchTypeFromQuery(router.query);
    const [showAll, setShowAll] = useState(false);

    // Переход по выбранной строке: tour_id = id именно этого предложения
    // (для наших `t…` backend перехватит package_details сам, для LT — обычный поток).
    const handleBook = async (id) => {
      const requestId = Array.isArray(router.query.request_id)
        ? router.query.request_id[0]
        : router.query.request_id;
      if (!requestId || !id) return;
      const res = await createPackage({ request_id: requestId as never, tour_id: id as never });
      const packageId = res?.package?.id;
      if (!packageId) {
        console.error('createPackage returned no package.id', res);
        return;
      }
      navigateAfterPackageCreate(router, packageId, searchType);
    };

    const formatDate = (dateStr) => {
        const [year, month, day] = dateStr.split('-');
        return `С ${day}.${month}`;
    };

    const offersForType = useMemo(
        () => (item ?? []).filter((room) => room.type === type),
        [item, type],
    );

    // Room Type v3: одна карточка номера, внутри две группы предложений —
    // «Arlekino» (lt_extras.totus.custom) и «Level.Travel»; внутри группы сортировка по цене.
    // Заголовки групп не выводим: оператор и так указан в каждой строке предложения.
    const offerGroups = useMemo<OfferGroup[]>(() => {
        const split = splitOffersBySource(offersForType);
        return OFFER_GROUP_ORDER
            .map((source) => ({ source, offers: split[source] }))
            .filter((group) => group.offers.length > 0);
    }, [offersForType]);

    // «Лучшая цена»: флаг extras.best_price приходит от Level.Travel и относится только к его
    // собственным ценам — нашим предложениям backend ставит best_price = false. Поэтому бейдж
    // показываем там, где его показал бы Level.Travel (если флаг есть хоть у одного предложения),
    // но вешаем на самое дешёвое предложение списка — включая наше, если оно дешевле.
    const bestPriceOfferId = useMemo(() => {
        if (!offersForType.some((offer) => offer?.extras?.best_price)) return null;
        let bestId: string | number | null = null;
        let bestPrice: number | null = null;
        for (const offer of offersForType) {
            const price = getOfferPrice(offer);
            if (price == null) continue;
            if (bestPrice == null || price < bestPrice) {
                bestPrice = price;
                bestId = offer?.id ?? null;
            }
        }
        return bestId;
    }, [offersForType]);

    const totalCount = offerGroups.reduce((sum, group) => sum + group.offers.length, 0);
    // Свёрнуто: по самому дешёвому предложению каждой группы; «Показать ещё» — общая.
    const visibleCount = showAll ? totalCount : offerGroups.length;
    const hiddenCount = Math.max(0, totalCount - visibleCount);

    if (!totalCount) return null;

    const renderOffer = (room: any) => {
        const confirmabilityLabel = getOfferConfirmabilityDisplayLabel(room);
        const displayInfo = getOfferDisplayInfo(room);
        const secondaryTags = displayInfo.tags.filter(
            (tag) => tag !== confirmabilityLabel,
        );
        const hasBestPrice = bestPriceOfferId != null && room?.id === bestPriceOfferId;
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
                                    {formatPriceRub(room?.analytics_price ?? room?.price)}
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
    };

    return (
        <div className={styles.HotelDetailsPriceList}>
            <div className={styles.HotelDetailsPriceListHead}>
                <p>{roomTypeName?.[type]}</p>
                {item?.description?.length > 1 && <p>{item?.description}</p>}
            </div>
            <div className={styles.HotelDetailsPriceListItems}>
                {offerGroups.map((group) => {
                    const visibleOffers = showAll ? group.offers : group.offers.slice(0, 1);
                    return (
                        <React.Fragment key={group.source}>
                            {visibleOffers.map(renderOffer)}
                        </React.Fragment>
                    );
                })}

                {hiddenCount > 0 ? (
                    <button
                        type="button"
                        className={styles.HotelDetailsPriceListShowMore}
                        onClick={() => setShowAll((prev) => !prev)}
                    >
                        {showAll
                            ? 'Скрыть варианты'
                            : `Показать ещё ${hiddenCount} ${
                                hiddenCount === 1
                                    ? 'вариант'
                                    : hiddenCount < 5
                                      ? 'варианта'
                                      : 'вариантов'
                              }`}
                    </button>
                ) : null}
            </div>
        </div>
    );
};

export default HotelDetailsPriceList;
