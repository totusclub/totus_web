import { useMemo, useState } from "react";
import styles from '../hotelDetails.module.css';
import VerticalSlider from "@/components/UI/verticalSlide";
import Button from "@/components/UI/button";
import Icon from "@/components/icons/Icon";
import { useRouter } from "next/router";
import {
    findCheapestOfferForStartDate,
    getAvailableStartDatesFromRooms,
    getNightsConstraintFromQuery,
    HOTEL_DETAILS_DEFAULT_FLEX_DATES,
} from "@/utils/hotelDetailsUtils";
import {
    getOfferPriceTitle,
    getSearchTypeFromQuery,
} from "@/utils/bookingFlowUtils";
import HotelFavoriteButton from "@/components/hotelDetails/HotelFavoriteButton";
import AuthModal from "@/components/auth/LazyAuthModal";
import {
    buildListRoomPickFromQuery,
    findListMatchedOfferAcrossRooms,
    formatListRoomOfferLabel,
    resolveExactMealIdsFromPick,
} from "@/utils/listRoomPick";
import { groupThousands, RUB_SUFFIX } from "@/utils/formatPrice";
import HotelIcon from '@/components/icons/totus/HotelIcon';
import { mealIcon } from '@/components/icons/totus/ltIcons';

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

    const listRoomPick = useMemo(
        () => buildListRoomPickFromQuery(router.query as Record<string, string | string[] | undefined>),
        [router.query],
    );

    // Prefer URL/search start_date so first navigation matches the list card date.
    const effectiveRoomDate = useMemo(() => {
        const availableDates = getAvailableStartDatesFromRooms(rooms as any[]);
        const preferred =
            listRoomPick?.startDate ||
            selectedRoomDate ||
            "";

        if (preferred && availableDates.includes(preferred)) {
            return preferred;
        }
        if (preferred) return preferred;
        if (selectedRoomDate && availableDates.includes(selectedRoomDate)) {
            return selectedRoomDate;
        }
        return availableDates[0] || selectedRoomDate || "";
    }, [rooms, selectedRoomDate, listRoomPick?.startDate]);

    const listMatched = useMemo(
        () =>
            findListMatchedOfferAcrossRooms(
                rooms as any[],
                listRoomPick,
                effectiveRoomDate || listRoomPick?.startDate || null,
            ),
        [rooms, listRoomPick, effectiveRoomDate],
    );

    const searchMealIds = useMemo(
        () => resolveExactMealIdsFromPick(listRoomPick),
        [listRoomPick],
    );

    const cheapestOffer = useMemo(() => {
        if (!effectiveRoomDate) return null;
        return findCheapestOfferForStartDate(
            rooms as any[],
            effectiveRoomDate,
            nightsConstraint.searchNights,
            nightsConstraint.nightsRange,
            // Keep header inside search meals — never fall back to other meal "other prices".
            searchMealIds.length ? searchMealIds : null,
        );
    }, [rooms, effectiveRoomDate, nightsConstraint, searchMealIds]);

    // Prefer list-matched offer so header price matches search results.
    const highlightOffer = listMatched?.offer ?? cheapestOffer;

    const hasRooms = Array.isArray(rooms) && rooms.length > 0;
    const listPrice = listRoomPick?.roomPrice;

    const matchedOfferPrice = useMemo(() => {
        if (!highlightOffer) return null;
        const value = Number(
            (highlightOffer as any)?.analytics_price ?? (highlightOffer as any)?.price,
        );
        return Number.isFinite(value) ? value : null;
    }, [highlightOffer]);

    // Live cheapest/matched offer from rooms for these search params.
    // Do not stick to URL list_price — AI deep links omit it on purpose.
    const offerPrice = useMemo(() => {
        if (matchedOfferPrice != null) return matchedOfferPrice;
        // While rooms are still loading, optional list_price is only a soft placeholder
        // (search-list navigation). AI chat links do not send it.
        if (panding || !hasRooms || !searchAttempted) {
            return listPrice ?? undefined;
        }
        return listPrice ?? undefined;
    }, [
        matchedOfferPrice,
        listPrice,
        panding,
        hasRooms,
        searchAttempted,
    ]);

    const priceFormatted =
        offerPrice != null
            ? groupThousands(Math.round(Number(offerPrice)))
            : "—";

    const roomOfferLabel = useMemo(() => {
        if (!listRoomPick) return '';
        return formatListRoomOfferLabel({
            ...listRoomPick,
            roomType: listMatched?.room?.room?.name_ru || listRoomPick.roomType,
            mealId: listRoomPick.mealId || listMatched?.mealId,
        });
    }, [listRoomPick, listMatched]);

    // Иконка питания у строки «номер · питание»: один код — своя иконка, несколько — общая.
    const roomOfferMealIcon = useMemo(() => {
        const codes = String(listRoomPick?.mealId || listMatched?.mealId || '')
            .split(',')
            .map((c) => c.trim())
            .filter(Boolean);
        if (codes.length === 1) return mealIcon(codes[0]);
        return codes.length > 1 ? 'meal-other' : null;
    }, [listRoomPick, listMatched]);

    // Название отеля — в шапке окна «Все фото».
    const hotelName = typeof hotel?.name === "string" ? hotel.name : "";

    const handleChooseRoomClick = () => {
        scrollToChooseRoomSection();
    };

    // Число ночей у даты: из выбранного предложения, иначе из параметров поиска (как было в тексте).
    const offerNights =
        (highlightOffer as any)?.nights_count != null
            ? (highlightOffer as any).nights_count
            : nightsConstraint.searchNights != null
              ? nightsConstraint.searchNights
              : null;

    const formatDate = useMemo(() => {
        const startDate =
            (listMatched?.offer as any)?.start_date ||
            listRoomPick?.startDate ||
            effectiveRoomDate ||
            (highlightOffer as any)?.start_date;
        if (!startDate) return "";
        const date = new Date(String(startDate));
        const formatter = new Intl.DateTimeFormat("ru-RU", {
            day: "numeric",
            month: "long",
        });
        return `с ${formatter.format(date)}`;
    }, [listMatched, listRoomPick?.startDate, effectiveRoomDate, highlightOffer]);

    // Only when search finished and there are truly no rooms — not when offer match lags behind.
    const showNoRoomsPrice =
        searchAttempted && !panding && !hasRooms && listPrice == null && !highlightOffer;

    return (
        <>
            {!panding ? (
                <div className={"content"}>
                    <div className={styles.HotelDetailsInfoRow}>
                        <VerticalSlider loading={panding} images={images} title={hotelName} />
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
                                                <p className={styles.HotelDetailsInfoPriceText}>от {priceFormatted}{RUB_SUFFIX}</p>
                                                <div className={styles.HotelDetailsInfoDate}>
                                                    <p className={styles.HotelDetailsInfoDateTitle}>{getOfferPriceTitle(searchType)}</p>
                                                    {roomOfferLabel ? (
                                                        <p className={`${styles.HotelDetailsInfoDateText} ${styles.HotelDetailsInfoIconLine}`}>
                                                            <HotelIcon name={roomOfferMealIcon} size={16} />
                                                            <span>{roomOfferLabel}</span>
                                                        </p>
                                                    ) : null}
                                                    <p className={`${styles.HotelDetailsInfoDateText} ${styles.HotelDetailsInfoIconLine}`}>
                                                        {formatDate ? <HotelIcon name="calendar" size={16} /> : null}
                                                        <span>{formatDate}</span>
                                                        {offerNights != null ? (
                                                            <>
                                                                <HotelIcon name="nights" size={16} className={styles.HotelDetailsInfoIconGap} />
                                                                <span>{offerNights} ночей</span>
                                                            </>
                                                        ) : null}
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
                        {/* Фото отеля уже есть (/references/hotels) — не ждём поиск номеров.
                            Пока images пустые, VerticalSlider сам показывает тот же плейсхолдер. */}
                        <VerticalSlider loading={false} images={images} title={hotelName} />
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
