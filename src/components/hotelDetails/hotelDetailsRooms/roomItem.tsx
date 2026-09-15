import styles from '../hotelDetails.module.css';
import chipStyles from './roomOperatorChip.module.css';
import HotelDetailsPriceList from "@/components/hotelDetails/hotelDetailsRooms/priceList";
import SmallSlider from "@/components/UI/smallSlide";
import GalleryModal from "@/components/UI/galleryModal";
import RoomImagePlaceholder from "@/components/hotelDetails/hotelDetailsRooms/RoomImagePlaceholder";
import React, { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/router";
import {
    getNightsConstraintFromQuery,
    offerMatchesNightsConstraint,
    HOTEL_DETAILS_DEFAULT_FLEX_DATES,
} from "@/utils/hotelDetailsUtils";
import { resolveExactMealIdsFromPick, type ListRoomPick } from "@/utils/listRoomPick";

type RoomImage = {
    x900?: string;
};

const HotelDetailsRoomItem = ({
    item,
    selectedDate,
    listRoomPick = null,
}: {
    item: any;
    selectedDate?: string;
    listRoomPick?: ListRoomPick | null;
}) => {
    const router = useRouter();
    const nightsConstraint = useMemo(
        () => getNightsConstraintFromQuery(router.query, {
            defaultFlexDates: HOTEL_DETAILS_DEFAULT_FLEX_DATES,
        }),
        [router.query],
    );
    const [isRoomGalleryOpen, setIsRoomGalleryOpen] = useState(false);
    const [imageError, setImageError] = useState(false);

    const roomImages = useMemo(
        () =>
            (item?.room?.images ?? []).filter(
                (image: RoomImage) => Boolean(image?.x900),
            ),
        [item?.room?.images],
    );

    const preferredMealIds = useMemo(
        () => resolveExactMealIdsFromPick(listRoomPick),
        [listRoomPick],
    );

    const offersForDate = useMemo(() => {
        if (!selectedDate || !item?.offers) return [];

        return Object.entries(item.offers).flatMap(([type, offers]) =>
            (offers as any[])
                .filter(
                    (offer) =>
                        offer.start_date === selectedDate &&
                        offerMatchesNightsConstraint(offer, nightsConstraint),
                )
                .map((offer) => ({ type, ...offer })),
        );
    }, [selectedDate, item?.offers, nightsConstraint]);

    // Own Room Type (totus_API custom rooms) shares name/photos/description with the
    // Level.Travel source room — mark the card with its operator so the two are distinguishable.
    const isCustomRoom = Boolean(item?.lt_extras?.totus?.custom);
    const customOperatorLabel = useMemo(() => {
        if (!isCustomRoom) return null;
        const names = Array.from(
            new Set(
                offersForDate
                    .map((offer) => String(offer?.operator_name ?? '').trim())
                    .filter(Boolean),
            ),
        );
        return names.length ? names.join(', ') : null;
    }, [isCustomRoom, offersForDate]);

    // Meals are already filtered by active room filters — do not re-lock to search URL meals
    // (that hid UAI when the user switched from «Всё включено» to «Ультра всё включено»).
    // Order meal sections by cheapest offer first (min price on top).
    const visibleOfferTypes = useMemo(() => {
        const types = Array.from(new Set(offersForDate.map((offer) => offer.type)));

        const minPriceByType = new Map<string, number>();
        for (const offer of offersForDate) {
            const price = Number(offer?.analytics_price ?? offer?.price);
            if (!Number.isFinite(price)) continue;
            const prev = minPriceByType.get(offer.type);
            if (prev == null || price < prev) {
                minPriceByType.set(offer.type, price);
            }
        }

        return [...types].sort((a, b) => {
            const priceA = minPriceByType.get(a) ?? Number.POSITIVE_INFINITY;
            const priceB = minPriceByType.get(b) ?? Number.POSITIVE_INFINITY;
            if (priceA !== priceB) return priceA - priceB;

            // Same min price: keep preferred search meal slightly ahead as tie-break.
            if (preferredMealIds.length) {
                const aPreferred = preferredMealIds.includes(String(a).toUpperCase()) ? 0 : 1;
                const bPreferred = preferredMealIds.includes(String(b).toUpperCase()) ? 0 : 1;
                if (aPreferred !== bPreferred) return aPreferred - bPreferred;
            }
            return String(a).localeCompare(String(b));
        });
    }, [offersForDate, preferredMealIds]);

    useEffect(() => {
        setImageError(false);
    }, [roomImages]);

    const singleImageUrl = roomImages[0]?.x900;
    const hasGallery = roomImages.length > 0 && !imageError;

    const renderRoomImage = () => {
        if (roomImages.length > 1) {
            return <SmallSlider images={roomImages} />;
        }

        if (!singleImageUrl || imageError) {
            return (
                <div className={styles.HotelDetailsRoomImage}>
                    <RoomImagePlaceholder />
                </div>
            );
        }

        return (
            <div
                className={styles.HotelDetailsRoomImage}
                onClick={() => setIsRoomGalleryOpen(true)}
            >
                <img
                    src={singleImageUrl}
                    alt={item?.room?.name_ru || "Номер"}
                    onError={() => setImageError(true)}
                />
            </div>
        );
    };

    if (visibleOfferTypes.length === 0) {
        return null;
    }

    return (
        <div className={styles.HotelDetailsRoomItem}>
            <div className={styles.HotelDetailsRoom}>
                {renderRoomImage()}

                <div className={styles.HotelDetailsRoomInforamation}>
                    <p>
                        {item?.room?.name_ru}
                        {customOperatorLabel ? (
                            <span
                                className={chipStyles.chip}
                                title={`Предложение туроператора ${customOperatorLabel}`}
                            >
                                {customOperatorLabel}
                            </span>
                        ) : null}
                    </p>
                    <div className={styles.HotelDetailsRoomOptions}>
                        <div className={styles.HotelDetailsRoomOption}>
                            <p>{item?.room?.description}</p>
                        </div>
                        <div className={styles.HotelDetailsRoomfacilities}>
                            {item?.room?.facilities?.map((f: { name: string }, i: number) => (
                                <div key={i} className={styles.HotelDetailsRoomfacilitiesItem}>
                                    <p>{f.name}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {visibleOfferTypes.map((type) => (
                <HotelDetailsPriceList
                    key={type}
                    selectedDate={selectedDate}
                    item={offersForDate}
                    type={type}
                />
            ))}

            {hasGallery && (
                <GalleryModal
                    isOpen={isRoomGalleryOpen}
                    onClose={() => setIsRoomGalleryOpen(false)}
                    images={roomImages}
                    initialIndex={0}
                />
            )}
        </div>
    );
};

export default HotelDetailsRoomItem;
