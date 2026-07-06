import styles from '../hotelDetails.module.css';
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

type RoomImage = {
    x900?: string;
};

const HotelDetailsRoomItem = ({ item, selectedDate }: any) => {
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

    const visibleOfferTypes = useMemo(
        () => Array.from(new Set(offersForDate.map((offer) => offer.type))),
        [offersForDate],
    );

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
                    <p>{item?.room?.name_ru}</p>
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
