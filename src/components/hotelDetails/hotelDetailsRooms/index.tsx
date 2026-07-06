import styles from '../hotelDetails.module.css';
import DatesPrice from "@/components/hotelDetails/hotelDetailsRooms/datesPrice";
import HotelDetailsRoomItem from "@/components/hotelDetails/hotelDetailsRooms/roomItem";
import RoomsSkeleton from "@/components/hotelDetails/hotelDetailsRooms/roomsSkeleton";
import Icon from "@/components/icons/Icon";
import dynamic from "next/dynamic";
import Image from "next/image";
import RoomFilters from "@/components/hotelDetails/hotelDetailsRooms/roomFilters";
import { useMemo, useState, useEffect, useRef } from "react";
import { getHotelRooms } from "@/api/levelTravelApi";
import { useRouter } from "next/router";
import { buildMinOfferPricesByDate, filterRoomsByNightsConstraint, getAvailableDepartureDatesForHotelRooms, getNightsConstraintFromQuery, offerMatchesNightsConstraint, HOTEL_DETAILS_DEFAULT_FLEX_DATES, parseFlexDatesValue } from "@/utils/hotelDetailsUtils";
import {
    applyRoomFilters,
    buildHotelRoomsQueryParams,
    clearRoomFilters,
    enrichRoomFilterOptions,
    hasActiveRoomFilters,
    hasHotelRoomsQueryParams,
    mergeRoomFiltersWithOperators,
    resolveDisplayRooms,
    type HotelRoomFilters,
} from "@/utils/roomFilters";

const HotelLocationMap = dynamic(() => import("./HotelLocationMap"), {
    ssr: false,
    loading: () => <div className={styles.image_placeholder} style={{ width: "100%", height: "100%", minHeight: 160 }} />,
});

export type HotelDetailsMapInfo = {
    lat?: number | null;
    long?: number | null;
    lng?: number | null;
    address?: string;
    name?: string;
    fallbackImage?: string;
};

function resolveHotelCoords(info?: HotelDetailsMapInfo): { lat: number; lng: number } | null {
    if (!info) return null;
    const lat = Number(info.lat);
    const lng = Number(info.long ?? info.lng);
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
    if (Math.abs(lat) > 90 || Math.abs(lng) > 180) return null;
    if (lat === 0 && lng === 0) return null;
    return { lat, lng };
}

interface HotelDetailsRoomsProps {
    rooms: any[];
    roomFilters?: HotelRoomFilters | null;
    loading?: boolean;
    hotelMap?: HotelDetailsMapInfo;
    selectedDate: string;
    onSelectedDateChange: (date: string) => void;
    /** Preferred departure date for ±flex date tabs (falls back to URL). */
    departureDate?: string;
    flexDates?: number;
}

const HotelDetailsRooms = ({
    rooms,
    roomFilters: roomFiltersFromApi,
    loading = false,
    hotelMap,
    selectedDate,
    onSelectedDateChange,
    departureDate,
    flexDates: flexDatesProp,
}: HotelDetailsRoomsProps) => {
    const router = useRouter();
    const nightsConstraint = useMemo(
        () => getNightsConstraintFromQuery(router.query, {
            defaultFlexDates: HOTEL_DETAILS_DEFAULT_FLEX_DATES,
        }),
        [router.query],
    );

    const toNightFilteredRooms = useMemo(
        () => (roomList: any[]) =>
            filterRoomsByNightsConstraint(roomList, nightsConstraint) as any[],
        [nightsConstraint],
    );

    const canonicalRooms = useMemo(
        () => toNightFilteredRooms(rooms),
        [rooms, toNightFilteredRooms],
    );
    const [activeRoomFilters, setActiveRoomFilters] = useState<HotelRoomFilters | null>(null);
    const [filterApiRooms, setFilterApiRooms] = useState<any[] | null>(null);
    const [filtersLoading, setFiltersLoading] = useState(false);
    const prevBaseRoomsKeyRef = useRef<string | null>(null);
    const lastFilterRequestKeyRef = useRef<string | null>(null);
    const filterRequestSeqRef = useRef(0);

    const requestId = Array.isArray(router.query.request_id)
        ? router.query.request_id[0]
        : router.query.request_id;
    const hotelIdFromQuery = Array.isArray(router.query.hotel_id)
        ? router.query.hotel_id[0]
        : router.query.hotel_id;

    const baseRoomsKey = useMemo(
        () => `${rooms.length}:${rooms[0]?.room?.id ?? ""}`,
        [rooms],
    );

    useEffect(() => {
        const isNewRoomSet =
            prevBaseRoomsKeyRef.current !== null && prevBaseRoomsKeyRef.current !== baseRoomsKey;
        prevBaseRoomsKeyRef.current = baseRoomsKey;

        setFilterApiRooms(null);
        lastFilterRequestKeyRef.current = null;

        setActiveRoomFilters((previous) =>
            mergeRoomFiltersWithOperators(
                roomFiltersFromApi,
                canonicalRooms,
                isNewRoomSet ? null : previous,
                canonicalRooms,
            ),
        );
    }, [roomFiltersFromApi, baseRoomsKey, canonicalRooms]);

    const handleFilterChange = (
        next: HotelRoomFilters | ((current: HotelRoomFilters) => HotelRoomFilters),
    ) => {
        setActiveRoomFilters((current) => {
            if (!current) return current;
            return typeof next === "function" ? next(current) : next;
        });
    };

    const filterQueryParams = useMemo(
        () => buildHotelRoomsQueryParams(activeRoomFilters),
        [activeRoomFilters],
    );

    const filterQueryKey = useMemo(
        () => JSON.stringify(filterQueryParams),
        [filterQueryParams],
    );

    const hasActiveFilters = hasActiveRoomFilters(activeRoomFilters);

    useEffect(() => {
        if (!hasActiveFilters) {
            setFilterApiRooms(null);
            lastFilterRequestKeyRef.current = null;
            setFiltersLoading(false);
            return;
        }

        if (!requestId || !hotelIdFromQuery || !activeRoomFilters) return;
        if (!hasHotelRoomsQueryParams(filterQueryParams)) return;
        if (filterQueryKey === lastFilterRequestKeyRef.current) return;

        setFiltersLoading(true);

        const requestSeq = ++filterRequestSeqRef.current;

        const timer = window.setTimeout(async () => {
            lastFilterRequestKeyRef.current = filterQueryKey;

            try {
                const response = await getHotelRooms({
                    request_id: String(requestId),
                    hotel_id: String(hotelIdFromQuery),
                    ...filterQueryParams,
                });

                if (requestSeq !== filterRequestSeqRef.current) return;

                const apiRooms = Array.isArray(response?.result) ? response.result : [];
                const exactNightApiRooms = toNightFilteredRooms(apiRooms);
                setFilterApiRooms(exactNightApiRooms);

                setActiveRoomFilters((previous) =>
                    mergeRoomFiltersWithOperators(
                        response?.filters,
                        exactNightApiRooms.length > 0 ? exactNightApiRooms : canonicalRooms,
                        previous,
                        canonicalRooms,
                    ),
                );
            } catch (error) {
                if (requestSeq !== filterRequestSeqRef.current) return;
                console.error("[HotelDetailsRooms] Failed to fetch filtered rooms:", error);
                lastFilterRequestKeyRef.current = null;
                setFilterApiRooms(null);
            } finally {
                if (requestSeq === filterRequestSeqRef.current) {
                    setFiltersLoading(false);
                }
            }
        }, 300);

        return () => {
            window.clearTimeout(timer);
        };
    }, [
        activeRoomFilters,
        filterQueryKey,
        filterQueryParams,
        hasActiveFilters,
        hotelIdFromQuery,
        requestId,
        rooms,
        canonicalRooms,
        toNightFilteredRooms,
    ]);

    const displayBaseRooms = useMemo(() => {
        if (!hasActiveFilters) return canonicalRooms;
        if (filtersLoading) return canonicalRooms;
        return filterApiRooms ?? canonicalRooms;
    }, [canonicalRooms, hasActiveFilters, filtersLoading, filterApiRooms]);

    const roomsMatchingFilters = useMemo(() => {
        if (!hasActiveFilters) return canonicalRooms;
        return applyRoomFilters(displayBaseRooms, activeRoomFilters) as any[];
    }, [canonicalRooms, displayBaseRooms, activeRoomFilters, hasActiveFilters]);

    const roomFlexDates = useMemo(
        () =>
            flexDatesProp ??
            parseFlexDatesValue(
                Array.isArray(router.query.flex_dates)
                    ? router.query.flex_dates[0]
                    : router.query.flex_dates,
                HOTEL_DETAILS_DEFAULT_FLEX_DATES,
            ),
        [flexDatesProp, router.query.flex_dates],
    );

    const allAvailableDates = useMemo(
        () =>
            getAvailableDepartureDatesForHotelRooms(
                canonicalRooms,
                router.query,
                HOTEL_DETAILS_DEFAULT_FLEX_DATES,
                {
                    startDate: departureDate,
                    flexDates: roomFlexDates,
                },
            ),
        [canonicalRooms, router.query, departureDate, roomFlexDates],
    );

    const effectiveSelectedDate = useMemo(() => {
        if (!allAvailableDates.length) return undefined;
        if (selectedDate && allAvailableDates.includes(selectedDate)) return selectedDate;
        return allAvailableDates[0];
    }, [allAvailableDates, selectedDate]);

    useEffect(() => {
        if (!effectiveSelectedDate || effectiveSelectedDate === selectedDate) return;
        onSelectedDateChange(effectiveSelectedDate);
    }, [effectiveSelectedDate, selectedDate, onSelectedDateChange]);

    const filteredRooms = useMemo(
        () =>
            resolveDisplayRooms(
                roomsMatchingFilters,
                null,
                effectiveSelectedDate,
                nightsConstraint.searchNights,
                (offer) => offerMatchesNightsConstraint(offer, nightsConstraint),
            ) as any[],
        [roomsMatchingFilters, effectiveSelectedDate, nightsConstraint],
    );

    const displayRoomFilters = useMemo(
        () => enrichRoomFilterOptions(canonicalRooms, activeRoomFilters),
        [canonicalRooms, activeRoomFilters],
    );

    const pricesList = useMemo((): Record<string, number | undefined> | undefined => {
        if (!allAvailableDates.length) return undefined;

        const priceSource = hasActiveFilters ? roomsMatchingFilters : canonicalRooms;
        const prices = buildMinOfferPricesByDate(
            priceSource,
            allAvailableDates,
            nightsConstraint.searchNights,
            nightsConstraint.nightsRange,
        );

        return allAvailableDates.reduce<Record<string, number | undefined>>((acc, date) => {
            acc[date] = prices[date];
            return acc;
        }, {});
    }, [allAvailableDates, canonicalRooms, roomsMatchingFilters, hasActiveFilters, nightsConstraint]);

    const hotelCoords = resolveHotelCoords(hotelMap);
    const mapBalloon = [hotelMap?.name, hotelMap?.address].filter(Boolean).join(" — ");

    if (loading) {
        return <RoomsSkeleton />;
    }

    if (!rooms || rooms.length === 0 || canonicalRooms.length === 0) {
        return (
            <div className={'content'}>
                <div className={styles.HotelDetailsRoomsRow}>
                    <div className={styles.HotelDetailsRooms}>
                        <div className={styles.HotelDetailsRoomsHead}>
                            <p>Номера не найдены</p>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    const showFilteredEmpty =
        hasActiveFilters &&
        !filtersLoading &&
        roomsMatchingFilters.length === 0;
    const showNoRoomsForDate =
        !filtersLoading &&
        canonicalRooms.length > 0 &&
        filteredRooms.length === 0;
    return (
        <div className={'content'}>
            <div className={styles.HotelDetailsRoomsRow}>
                <div className={styles.HotelDetailsRooms}>
                    <div id="choose-room" className={styles.HotelDetailsRoomsHead}>
                        <p>Выберите номер</p>
                    </div>
                    <DatesPrice
                        dates={pricesList ?? {}}
                        selectedDate={effectiveSelectedDate}
                        setSelectedDate={onSelectedDateChange}
                    />
                    <RoomFilters
                        filters={displayRoomFilters}
                        hasActiveFilters={hasActiveFilters}
                        loading={filtersLoading}
                        onChange={handleFilterChange}
                        onClear={() => {
                            if (!activeRoomFilters) return;
                            lastFilterRequestKeyRef.current = null;
                            setFilterApiRooms(null);
                            setActiveRoomFilters(clearRoomFilters(activeRoomFilters));
                        }}
                    />
                    {showFilteredEmpty ? (
                        <div className={styles.HotelDetailsRoomsEmpty}>
                            <p>По выбранным фильтрам номера не найдены</p>
                            <button
                                type="button"
                                className={styles.HotelDetailsRoomFiltersClear}
                                onClick={() => {
                                    if (!activeRoomFilters) return;
                                    lastFilterRequestKeyRef.current = null;
                                    setFilterApiRooms(null);
                                    setActiveRoomFilters(clearRoomFilters(activeRoomFilters));
                                }}
                            >
                                Сбросить фильтры
                            </button>
                        </div>
                    ) : showNoRoomsForDate ? (
                        <div className={styles.HotelDetailsRoomsEmpty}>
                            <p>На выбранную дату нет номеров по этим фильтрам</p>
                        </div>
                    ) : (
                        filteredRooms.map((r, i) => (
                            <HotelDetailsRoomItem key={i} item={r} selectedDate={effectiveSelectedDate} />
                        ))
                    )}

                </div>
                <div className={styles.HotelDetailsMap}>
                    <div className={styles.HotelDetailsMapBox}>
                        <div className={styles.HotelDetailsMapBoxTitle}>
                            <Icon name={"location"} size={16} />
                            <p>{hotelMap?.address || "Адрес отеля"}</p>
                        </div>
                        <div className={styles.map}>
                            {hotelCoords ? (
                                <HotelLocationMap
                                    lat={hotelCoords.lat}
                                    lng={hotelCoords.lng}
                                    balloonContent={mapBalloon}
                                />
                            ) : hotelMap?.fallbackImage ? (
                                <Image
                                    className={styles.mapFallbackImg}
                                    src={hotelMap.fallbackImage}
                                    alt={
                                        hotelMap?.name
                                            ? `Схема расположения: ${hotelMap.name}`
                                            : "Расположение отеля"
                                    }
                                    fill
                                    sizes="(max-width: 1200px) 100vw, 420px"
                                />
                            ) : (
                                <p className={styles.mapFallback}>
                                    {hotelMap?.address
                                        ? "Координаты отеля недоступны для карты."
                                        : "Адрес и координаты отеля не указаны."}
                                </p>
                            )}
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
};

export default HotelDetailsRooms;
