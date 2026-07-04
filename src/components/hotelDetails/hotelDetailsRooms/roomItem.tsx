import styles from '../hotelDetails.module.css';
import TourAgents from "@/components/hotelDetails/hotelDetailsRooms/tourAgents";
import HotelDetailsPriceList from "@/components/hotelDetails/hotelDetailsRooms/priceList";
import SmallSlider from "@/components/UI/smallSlide";
import GalleryModal from "@/components/UI/galleryModal";
import RoomImagePlaceholder from "@/components/hotelDetails/hotelDetailsRooms/RoomImagePlaceholder";
import React, { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/router";
import {
    getSearchNightsFromQuery,
    offerMatchesSearchNights,
} from "@/utils/hotelDetailsUtils";

type RoomImage = {
    x900?: string;
};

const HotelDetailsRoomItem = ({ item, selectedDate }: any) => {
    const router = useRouter();
    const searchNights = useMemo(
        () => getSearchNightsFromQuery(router.query),
        [router.query],
    );
    const [selectedOperator, setSelectedOperator] = useState<number | null>(null);
    const [isRoomGalleryOpen, setIsRoomGalleryOpen] = useState(false);
    const [imageError, setImageError] = useState(false);

    const roomImages = useMemo(
        () =>
            (item?.room?.images ?? []).filter(
                (image: RoomImage) => Boolean(image?.x900),
            ),
        [item?.room?.images],
    );

    const roomItems = useMemo(() => {
        if (selectedDate && item?.offers) {
            const filteredOffers = Object.entries(item.offers)
                .flatMap(([type, offers]) =>
                    (offers as any[])
                        .filter(
                            (offer) =>
                                offer.start_date === selectedDate &&
                                offerMatchesSearchNights(offer, searchNights),
                        )
                        .map((offer) => ({ type, ...offer })),
                );

            const seen = new Set<number>();
            const uniqueOperators = filteredOffers.filter((offer) => {
                if (seen.has(offer.operator_id)) return false;
                seen.add(offer.operator_id);
                return true;
            });

            const simplified = uniqueOperators.map((offer) => ({
                id: offer.operator_id,
                name: offer.operator_name,
            }));

            setSelectedOperator(simplified[0]?.id ?? null);
            return { offersRoom: filteredOffers, operators: simplified };
        }
        return undefined;
    }, [selectedDate, item?.offers, searchNights]);

    const visibleOfferTypes = useMemo(
        () => Array.from(new Set(roomItems?.offersRoom?.map((offer) => offer.type) ?? [])),
        [roomItems?.offersRoom],
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

            <TourAgents
                agents={roomItems?.operators}
                selectedOperator={selectedOperator}
                setSelectedOperator={setSelectedOperator}
            />

            {visibleOfferTypes.map((type) => (
                <HotelDetailsPriceList
                    key={type}
                    selectedOperator={selectedOperator}
                    selectedDate={selectedDate}
                    item={roomItems?.offersRoom}
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
