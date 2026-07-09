import { useMemo, useState } from "react";
import styles from '../hotelDetails.module.css';
import VerticalSlider from "@/components/UI/verticalSlide";
import Button from "@/components/UI/button";
import Icon from "@/components/icons/Icon";
import { useRouter } from "next/router";
import { findCheapestOfferForStartDate, getNightsConstraintFromQuery, HOTEL_DETAILS_DEFAULT_FLEX_DATES } from "@/utils/hotelDetailsUtils";
import {
    getOfferPriceTitle,
    getSearchTypeFromQuery,
} from "@/utils/bookingFlowUtils";
import HotelFavoriteButton from "@/components/hotelDetails/HotelFavoriteButton";
import AuthModal from "@/components/auth";

const CHOOSE_ROOM_SECTION_ID = "choose-room";

const scrollToChooseRoomSection = () => {
    const section = document.getElementById(CHOOSE_ROOM_SECTION_ID);
    section?.scrollIntoView({ behavior: "smooth", block: "start" });
};

type HotelDetailsInfoProps = {
    hotel?: Record<string, unknown> | null;
    hotelId?: string;
    images: unknown[];
    rooms: unknown[];
    panding: boolean;
    selectedRoomDate: string;
    /** True after hotel-scoped room search has finished. */
    searchAttempted?: boolean;
};

const HotelDetailsInfo = ({
    hotel,
    hotelId,
    images,
    rooms,
    panding,
    selectedRoomDate,
    searchAttempted = false,
}: HotelDetailsInfoProps) => {
    const router = useRouter();
    const searchType = getSearchTypeFromQuery(router.query);
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

    const nightsConstraint = useMemo(
        () => getNightsConstraintFromQuery(router.query, {
            defaultFlexDates: HOTEL_DETAILS_DEFAULT_FLEX_DATES,
        }),
        [router.query],
    );

    const highlightOffer = useMemo(
        () =>
            findCheapestOfferForStartDate(
                rooms as any[],
                selectedRoomDate,
                nightsConstraint.searchNights,
                nightsConstraint.nightsRange,
            ),
        [rooms, selectedRoomDate, nightsConstraint],
    );

    const handleChooseRoomClick = () => {
        scrollToChooseRoomSection();
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

    const showNoRoomsPrice = searchAttempted && !panding && !highlightOffer;

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
                                        {showNoRoomsPrice ? (
                                            <>
                                                <p className={styles.HotelDetailsInfoPriceEmptyTitle}>
                                                    Номера не найдены
                                                </p>
                                                <div className={styles.HotelDetailsInfoDate}>
                                                    <p className={styles.HotelDetailsInfoDateTitle}>
                                                        По выбранным параметрам поиска
                                                    </p>
                                                    <p className={styles.HotelDetailsInfoDateText}>
                                                        Нет доступных номеров на эти даты и количество ночей
                                                    </p>
                                                </div>
                                            </>
                                        ) : (
                                            <>
                                                <p className={styles.HotelDetailsInfoPriceText}>от {priceFormatted}₽</p>
                                                <div className={styles.HotelDetailsInfoDate}>
                                                    <p className={styles.HotelDetailsInfoDateTitle}>{getOfferPriceTitle(searchType)}</p>
                                                    <p className={styles.HotelDetailsInfoDateText}>
                                                        {formatDate}
                                                        {highlightOffer?.nights_count != null
                                                            ? `, ${highlightOffer.nights_count} ночей`
                                                            : ""}
                                                    </p>
                                                </div>
                                            </>
                                        )}
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
                                    onClick={handleChooseRoomClick}
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
