import { useMemo, useState } from "react";
import styles from '../hotelDetails.module.css';
import VerticalSlider from "@/components/UI/verticalSlide";
import Button from "@/components/UI/button";
import Icon from "@/components/icons/Icon";
import TrackPrices from "@/components/UI/trackPrices";
import { createPackage } from "@/api/levelTravelApi";
import { useRouter } from "next/router";
import { findCheapestOfferForStartDate } from "@/utils/hotelDetailsUtils";
import HotelFavoriteButton from "@/components/hotelDetails/HotelFavoriteButton";
import AuthModal from "@/components/auth";

type HotelDetailsInfoProps = {
    hotel?: Record<string, unknown> | null;
    hotelId?: string;
    images: unknown[];
    rooms: unknown[];
    panding: boolean;
    selectedRoomDate: string;
};

const HotelDetailsInfo = ({
    hotel,
    hotelId,
    images,
    rooms,
    panding,
    selectedRoomDate,
}: HotelDetailsInfoProps) => {
    const router = useRouter();
    const [priceTrack, setPriceTrack] = useState<boolean>(false);
    const [loading, setLoading] = useState(false);
    const [authModalOpen, setAuthModalOpen] = useState(false);

    const resolvedHotelId =
        (hotelId && String(hotelId)) ||
        (typeof router.query.hotel_id === "string"
            ? router.query.hotel_id
            : Array.isArray(router.query.hotel_id)
              ? router.query.hotel_id[0]
              : "") ||
        "";

    const hotelPayload = useMemo(() => {
        if (hotel && typeof hotel === "object") {
            return hotel as Record<string, unknown>;
        }
        return null;
    }, [hotel]);

    const highlightOffer = useMemo(
        () => findCheapestOfferForStartDate(rooms as any[], selectedRoomDate),
        [rooms, selectedRoomDate]
    );

    const handleBook = async (id: any) => {
        setLoading(true);
        const res = await createPackage({ request_id: router.query.request_id, tour_id: id });
        setLoading(false);
        router.push(`/tickets?package=${res.package.id}`);
    };
    const formatDate = useMemo(() => {
        if (!highlightOffer?.start_date) return "";
        const date = new Date(highlightOffer.start_date);
        const formatter = new Intl.DateTimeFormat("ru-RU", {
            day: "numeric",
            month: "long",
        });
        return `с ${formatter.format(date)}`;
    }, [highlightOffer?.start_date]);

    const priceFormatted =
        highlightOffer?.price != null
            ? String(highlightOffer.price).replace(/\B(?=(\d{3})+(?!\d))/g, "\u202F")
            : "—";

    return (
        <>
            {!panding ? (
                <div className={"content"}>
                    <div className={styles.HotelDetailsInfoRow}>
                        <VerticalSlider loading={panding} images={images} />
                        <div className={styles.HotelDetailsInfo}>
                            <div className={styles.HotelDetailsInfoPrice}>
                                <div className={styles.HotelDetailsInfoPriceTop}>
                                    <div className={styles.HotelDetailsInfoPriceMain}>
                                        <p className={styles.HotelDetailsInfoPriceText}>от {priceFormatted}₽</p>
                                        <div className={styles.HotelDetailsInfoDate}>
                                            <p className={styles.HotelDetailsInfoDateTitle}>Цена за тур с перелётом</p>
                                            <p className={styles.HotelDetailsInfoDateText}>
                                                {formatDate}
                                                {highlightOffer?.nights_count != null
                                                    ? `, ${highlightOffer.nights_count} ночей`
                                                    : ""}
                                            </p>
                                        </div>
                                    </div>
                                    {hotelPayload && resolvedHotelId ? (
                                        <div className={styles.HotelDetailsInfoPriceFav}>
                                            <HotelFavoriteButton
                                                hotelId={resolvedHotelId}
                                                hotelData={hotelPayload}
                                                onNeedAuth={() => setAuthModalOpen(true)}
                                                iconSize={22}
                                            />
                                        </div>
                                    ) : null}
                                </div>
                                <Button
                                    loading={loading}
                                    disabled={highlightOffer?.id == null}
                                    onClick={() => highlightOffer?.id != null && handleBook(highlightOffer.id)}
                                    title={"Выбрать номер"}
                                    full={true}
                                />
                            </div>
                            <div className={styles.HotelDetailsInfoMessage}>
                                <div className={styles.HotelDetailsInfoMessageIcon}>
                                    <Icon name={"travel"} size={61} />
                                </div>
                                <p className={styles.HotelDetailsInfoMessageText}>
                                    Это место предлагает уникальный опыт, сочетая роскошь и природу. Мы здесь, чтобы
                                    помочь вам осуществить вашу мечту о путешествии!
                                </p>
                            </div>
                            <TrackPrices
                                text={"Автоматические оповещения \n при изменении цен."}
                                priceTrack={priceTrack}
                                setPriceTrack={setPriceTrack}
                            />
                        </div>
                    </div>
                </div>
            ) : (
                <div className={"content"}>
                    <div className={styles.HotelDetailsInfoRow}>
                        <VerticalSlider loading={panding} images={images} />
                        <div className={styles.HotelDetailsInfo}>
                            <div className={styles.HotelDetailsInfoPrice}>
                                <div className={styles.animationTextlazy1}></div>
                                <div className={styles.animationTextlazy2}></div>
                                <div className={styles.animationButtonLazy}></div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
            <AuthModal open={authModalOpen} setOpen={setAuthModalOpen} />
        </>
    );
};

export default HotelDetailsInfo;
