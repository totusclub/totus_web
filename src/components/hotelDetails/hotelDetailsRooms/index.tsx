import styles from '../hotelDetails.module.css';
// import DatesPrice from "@/components/hotelDetails/hotelDetailsRooms/datesPrice"; // date tabs removed
import HotelDetailsRoomItem from "@/components/hotelDetails/hotelDetailsRooms/roomItem";
import RoomsSkeleton from "@/components/hotelDetails/hotelDetailsRooms/roomsSkeleton";
import Icon from "@/components/icons/Icon";
import dynamic from "next/dynamic";
import Image from "next/image";
import RoomFilters from "@/components/hotelDetails/hotelDetailsRooms/roomFilters";
import RoomsEmptyState from "@/components/hotelDetails/hotelDetailsRooms/RoomsEmptyState";
import { useMemo, useState, useEffect, useRef } from "react";
import { getHotelRooms } from "@/api/levelTravelApi";
import { useRouter } from "next/router";
import { filterRoomsByNightsConstraint, getAvailableDepartureDatesForHotelRooms, getNightsConstraintFromQuery, offerMatchesNightsConstraint, HOTEL_DETAILS_DEFAULT_FLEX_DATES, parseFlexDatesValue } from "@/utils/hotelDetailsUtils";
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
import {
    applyListPickToRoomFilters,
    buildListRoomPickFromQuery,
    enrichListRoomPickFromRooms,
    filterRoomsByMealCodes,
    normalizeSearchMealsToRoomCodes,
    resolveExactMealIdsFromPick,
    resolveListSelectedRoom,
    sortRoomsWithListPickFirst,
} from "@/utils/listRoomPick";

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
    /** True after hotel-scoped search has run (or is in progress with a request_id). */
    searchAttempted?: boolean;
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
    searchAttempted = false,
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
    const listPickAppliedRef = useRef(false);
    const userChangedFiltersRef = useRef(false);
    const prevListPickMealKeyRef = useRef<string | null>(null);

    const listRoomPick = useMemo(
        () => buildListRoomPickFromQuery(router.query as Record<string, string | string[] | undefined>),
        [router.query],
    );

    // Search meal/operator from URL — works even before listRoomPick is fully built.
    // Prefer filter_meals (full search multi-select) and union with meal_id when both exist.
    const filterListRoomPick = useMemo(() => {
        const joinQueryValue = (value: string | string[] | undefined): string | undefined => {
            if (value == null) return undefined;
            if (Array.isArray(value)) {
                const joined = value.map((part) => String(part).trim()).filter(Boolean).join(',');
                return joined || undefined;
            }
            const trimmed = String(value).trim();
            return trimmed || undefined;
        };

        // Only URL meal params count — do not revive stale AI from session/search list state.
        const rawFilterMeals = joinQueryValue(router.query.filter_meals);
        const rawMealId = joinQueryValue(router.query.meal_id);

        if (typeof window !== 'undefined' && !rawFilterMeals) {
            sessionStorage.removeItem('hotelDetailsFilterMeals');
        }

        const mealCodes = Array.from(
            new Set([
                ...normalizeSearchMealsToRoomCodes(rawFilterMeals),
                ...normalizeSearchMealsToRoomCodes(rawMealId),
                ...normalizeSearchMealsToRoomCodes(listRoomPick?.mealId),
            ]),
        );
        const mealId = mealCodes.length
            ? mealCodes.join(',')
            : rawFilterMeals || rawMealId || listRoomPick?.mealId || undefined;

        const operatorId =
            joinQueryValue(router.query.filter_operators) ||
            joinQueryValue(router.query.operator_id) ||
            (listRoomPick?.operatorId != null ? String(listRoomPick.operatorId) : undefined);

        if (!listRoomPick && !mealId && !operatorId) return null;

        return {
            ...(listRoomPick ?? {}),
            // Multi-meal search: don't keep a single mealType that hides other selected meals.
            mealType:
                mealCodes.length > 1
                    ? undefined
                    : listRoomPick?.mealType,
            mealId: mealId ? String(mealId) : undefined,
            operatorId: operatorId ? String(operatorId) : listRoomPick?.operatorId,
            operatorName: listRoomPick?.operatorName,
            roomPrice: listRoomPick?.roomPrice,
            startDate: listRoomPick?.startDate,
        };
    }, [
        listRoomPick,
        router.query.filter_meals,
        router.query.meal_id,
        router.query.filter_operators,
        router.query.operator_id,
    ]);

    const enrichedListRoomPick = useMemo(
        () => enrichListRoomPickFromRooms(filterListRoomPick, canonicalRooms, selectedDate || null),
        [filterListRoomPick, canonicalRooms, selectedDate],
    );

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

        if (isNewRoomSet) {
            listPickAppliedRef.current = false;
            // Do not clear userChangedFilters on every room poll — only on real new search set.
        }

        setActiveRoomFilters((previous) => {
            const merged = mergeRoomFiltersWithOperators(
                roomFiltersFromApi,
                canonicalRooms,
                isNewRoomSet ? null : previous,
                canonicalRooms,
            );

            const pickKey = JSON.stringify({
                mealId: filterListRoomPick?.mealId ?? null,
                operatorId: filterListRoomPick?.operatorId ?? null,
            });
            if (prevListPickMealKeyRef.current !== pickKey) {
                listPickAppliedRef.current = false;
                userChangedFiltersRef.current = false;
                prevListPickMealKeyRef.current = pickKey;
            }

            if (!merged) return previous;

            if (filterListRoomPick && !userChangedFiltersRef.current) {
                const withPick = applyListPickToRoomFilters(merged, filterListRoomPick);
                const hasMealsSelected = withPick?.meals?.some((meal) => meal.selected);
                const hasOperatorSelected = withPick?.operators?.some((operator) => operator.selected);
                if (hasMealsSelected || hasOperatorSelected) {
                    listPickAppliedRef.current = true;
                    return withPick;
                }
            }

            return merged;
        });
    }, [roomFiltersFromApi, baseRoomsKey, canonicalRooms, filterListRoomPick]);

    const handleFilterChange = (
        next: HotelRoomFilters | ((current: HotelRoomFilters) => HotelRoomFilters),
    ) => {
        userChangedFiltersRef.current = true;
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
        if (!hasHotelRoomsQueryParams(filterQueryParams)) {
            // Только клиентские фильтры (например, оператор «Arlekino», которого нет в LT):
            // API не зовём, а прошлый отфильтрованный ответ сбрасываем — фильтруем базовые номера.
            setFilterApiRooms(null);
            lastFilterRequestKeyRef.current = null;
            setFiltersLoading(false);
            return;
        }
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

                setActiveRoomFilters((previous) => {
                    const merged = mergeRoomFiltersWithOperators(
                        response?.filters,
                        exactNightApiRooms.length > 0 ? exactNightApiRooms : canonicalRooms,
                        previous,
                        canonicalRooms,
                    );
                    // Filtered API often returns a subset of meal options — re-apply
                    // search multi-select until the user changes filters manually.
                    if (
                        merged &&
                        filterListRoomPick &&
                        !userChangedFiltersRef.current
                    ) {
                        return applyListPickToRoomFilters(merged, filterListRoomPick) ?? merged;
                    }
                    return merged;
                });
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
        filterListRoomPick,
    ]);

    const displayBaseRooms = useMemo(() => {
        if (!hasActiveFilters) return canonicalRooms;
        // While filtered API loads, keep canonical rooms — meal codes are applied client-side below.
        if (filtersLoading) return canonicalRooms;
        return filterApiRooms ?? canonicalRooms;
    }, [canonicalRooms, hasActiveFilters, filtersLoading, filterApiRooms]);

    const searchMealIds = useMemo(
        () => resolveExactMealIdsFromPick(filterListRoomPick),
        [filterListRoomPick],
    );

    const roomsMatchingFilters = useMemo(() => {
        let result: any[] = hasActiveFilters
            ? (applyRoomFilters(displayBaseRooms, activeRoomFilters) as any[])
            : canonicalRooms;

        // Always enforce search-list meal on first open (before checkboxes / API catch up).
        // Refresh worked because URL meals were already applied; first nav often painted too early.
        if (searchMealIds.length > 0 && !userChangedFiltersRef.current) {
            result = filterRoomsByMealCodes(result, searchMealIds) as any[];
        }

        const selectedMealIds = (activeRoomFilters?.meals ?? [])
            .filter((meal) => meal.selected)
            .map((meal) => String(meal.id).toUpperCase());
        const pickMealIds = resolveExactMealIdsFromPick(enrichedListRoomPick);
        const pickMealStillActive =
            !selectedMealIds.length ||
            pickMealIds.some((id) => selectedMealIds.includes(id));

        if (enrichedListRoomPick && pickMealStillActive && !userChangedFiltersRef.current) {
            const matchedRoom = resolveListSelectedRoom(
                canonicalRooms,
                enrichedListRoomPick,
                selectedDate || enrichedListRoomPick.startDate || null,
            );
            if (matchedRoom && !result.some((room) => String(room.ID) === String(matchedRoom.ID))) {
                const mealFiltered = filterRoomsByMealCodes(
                    [matchedRoom],
                    searchMealIds.length ? searchMealIds : null,
                );
                if (mealFiltered[0]) {
                    result = [mealFiltered[0], ...result];
                }
            }
        }

        return result;
    }, [
        canonicalRooms,
        displayBaseRooms,
        activeRoomFilters,
        hasActiveFilters,
        enrichedListRoomPick,
        selectedDate,
        searchMealIds,
    ]);

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

    const filteredRooms = useMemo(() => {
        const roomsForDate = resolveDisplayRooms(
            roomsMatchingFilters,
            null,
            effectiveSelectedDate,
            nightsConstraint.searchNights,
            (offer) => offerMatchesNightsConstraint(offer, nightsConstraint),
        ) as any[];

        return sortRoomsWithListPickFirst(
            roomsForDate,
            enrichedListRoomPick,
            effectiveSelectedDate ?? null,
        ) as any[];
    }, [roomsMatchingFilters, effectiveSelectedDate, nightsConstraint, enrichedListRoomPick]);

    const displayRoomFilters = useMemo(
        () => enrichRoomFilterOptions(canonicalRooms, activeRoomFilters),
        [canonicalRooms, activeRoomFilters],
    );

    // Date/price tabs removed — pricesList was only used by DatesPrice
    // const pricesList = useMemo((): Record<string, number | undefined> | undefined => {
    //     if (!allAvailableDates.length) return undefined;
    //
    //     const priceSource = hasActiveFilters ? roomsMatchingFilters : canonicalRooms;
    //     const prices = buildMinOfferPricesByDate(
    //         priceSource,
    //         allAvailableDates,
    //         nightsConstraint.searchNights,
    //         nightsConstraint.nightsRange,
    //     );
    //
    //     return allAvailableDates.reduce<Record<string, number | undefined>>((acc, date) => {
    //         acc[date] = prices[date];
    //         return acc;
    //     }, {});
    // }, [allAvailableDates, canonicalRooms, roomsMatchingFilters, hasActiveFilters, nightsConstraint]);

    const hotelCoords = resolveHotelCoords(hotelMap);
    const mapBalloon = [hotelMap?.name, hotelMap?.address].filter(Boolean).join(" — ");

    if (loading || !searchAttempted) {
        return <RoomsSkeleton />;
    }

    if (!rooms || rooms.length === 0) {
        return (
            <div className={'content'}>
                <div className={styles.HotelDetailsRoomsRow}>
                    <div className={styles.HotelDetailsRooms}>
                        <RoomsEmptyState
                            title="Номера не найдены"
                            description="Попробуйте изменить даты поиска или количество ночей и выполните поиск снова."
                        />
                    </div>
                </div>
            </div>
        );
    }

    if (canonicalRooms.length === 0) {
        return (
            <div className={'content'}>
                <div className={styles.HotelDetailsRoomsRow}>
                    <div className={styles.HotelDetailsRooms}>
                        <RoomsEmptyState
                            title="Нет номеров на выбранные даты и количество ночей"
                            description="Измените параметры поиска, чтобы увидеть доступные варианты."
                        />
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
                        {filtersLoading ? (
                            <p className={styles.HotelDetailsRoomFiltersLoading}>Обновляем варианты...</p>
                        ) : null}
                    </div>
                    {/* Date/price tabs removed
                    <DatesPrice
                        dates={pricesList ?? {}}
                        selectedDate={effectiveSelectedDate}
                        setSelectedDate={onSelectedDateChange}
                    />
                    */}
                    <RoomFilters
                        filters={displayRoomFilters}
                        hasActiveFilters={hasActiveFilters}
                        onChange={handleFilterChange}
                        onClear={() => {
                            if (!activeRoomFilters) return;
                            userChangedFiltersRef.current = true;
                            lastFilterRequestKeyRef.current = null;
                            setFilterApiRooms(null);
                            setActiveRoomFilters(clearRoomFilters(activeRoomFilters));
                        }}
                    />
                    {showFilteredEmpty ? (
                        <RoomsEmptyState
                            compact
                            title="По выбранным фильтрам номера не найдены"
                            description="Сбросьте фильтры или выберите другие параметры."
                        >
                            <button
                                type="button"
                                className={styles.HotelDetailsRoomFiltersClear}
                                onClick={() => {
                                    if (!activeRoomFilters) return;
                                    userChangedFiltersRef.current = true;
                                    lastFilterRequestKeyRef.current = null;
                                    setFilterApiRooms(null);
                                    setActiveRoomFilters(clearRoomFilters(activeRoomFilters));
                                }}
                            >
                                Сбросить фильтры
                            </button>
                        </RoomsEmptyState>
                    ) : showNoRoomsForDate ? (
                        <RoomsEmptyState
                            compact
                            title="На выбранную дату нет номеров по этим фильтрам"
                        />
                    ) : (
                        filteredRooms.map((r, i) => (
                            <HotelDetailsRoomItem
                                key={i}
                                item={r}
                                selectedDate={effectiveSelectedDate}
                                listRoomPick={
                                    userChangedFiltersRef.current ? null : filterListRoomPick
                                }
                            />
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
