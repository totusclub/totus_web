import Head from 'next/head';
import Steps from "@/components/searchPage/steps";
import HotelDetailsHeader from "@/components/hotelDetails/hotelDetailsHeader";
import HotelDetailsInfo from "@/components/hotelDetails/hotelDetailsInfo";
import HotelDetailsDesc from "@/components/hotelDetails/hotelDetailsDesc";
import HotelDetailsRooms from "@/components/hotelDetails/hotelDetailsRooms";
import HotelDetailsSkeleton from "@/components/hotelDetails/hotelDetailsSkeleton";
import HotelSearchSection, { type SearchParamsSnapshot } from "@/components/hotelDetails/hotelSearchSection";
import HotelReviewsModal from "@/components/hotelDetails/HotelReviewsModal";
import { useRouter } from "next/router";
import { useHotelDetails } from "@/hooks/useHotelDetails";
import { useHotelReviews } from "@/hooks/useHotelReviews";
import { useHotelRooms } from "@/hooks/useHotelRooms";
import { useInitialHotelSearch } from "@/hooks/useInitialHotelSearch";
import { useRequestIdSync } from "@/hooks/useRequestIdSync";
import { useInitialSearchParams } from "@/hooks/useInitialSearchParams";
import { SITE_NAME } from "@/config/seo";
import { getAvailableDepartureDatesForHotelRooms, getSearchStartDateFromQuery, resolveHotelDisplayMeta, HOTEL_DETAILS_DEFAULT_FLEX_DATES, parseFlexDatesValue } from "@/utils/hotelDetailsUtils";
import { getSearchTypeFromQuery } from "@/utils/bookingFlowUtils";
import { endYmdAfterNights } from "@/utils/calendarDateRange";
import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { useSelector } from "react-redux";
import type { RootState } from "@/store";
import { useStaleHotelSearchRefresh } from "@/hooks/useStaleHotelSearchRefresh";

export default function HotelDetails() {
    const router = useRouter();
    const hotelId = router.query.hotel_id as string;
    const queryStartDate = Array.isArray(router.query.start_date)
        ? router.query.start_date[0]
        : router.query.start_date;
    const [activeStartDate, setActiveStartDate] = useState<string | undefined>(undefined);
    const [selectedRoomDate, setSelectedRoomDate] = useState<string>("");
    const [reviewsModalOpen, setReviewsModalOpen] = useState(false);
    const [roomsSearchKey, setRoomsSearchKey] = useState(0);
    const [lastSearchSnapshot, setLastSearchSnapshot] = useState<SearchParamsSnapshot | null>(null);
    const prevActiveStartRef = useRef<string | undefined>(undefined);

    const { requestId, localRequestId, setLocalRequestId } = useRequestIdSync();

    const handleSearchComplete = useCallback(async (newRequestId: string, snapshot: SearchParamsSnapshot) => {
        setLastSearchSnapshot(snapshot);
        setActiveStartDate(snapshot.startDateISO);

        const endDateTill = endYmdAfterNights(snapshot.startDateISO, snapshot.nights);
        const newQuery: Record<string, string | string[] | undefined> = {
            ...router.query,
            request_id: newRequestId,
            start_date: snapshot.startDateISO,
            start_date_from: snapshot.startDateISO,
            nights: String(snapshot.nights),
            flex_dates: String(snapshot.flexDates),
            end_date_till: endDateTill,
            adults: String(snapshot.adults),
        };

        if (snapshot.kids > 0) {
            newQuery.kids = String(snapshot.kids);
            if (snapshot.kidsAges.length > 0) {
                newQuery.kids_ages = snapshot.kidsAges.map(String);
            }
        } else {
            delete newQuery.kids;
            delete newQuery.kids_ages;
        }

        setLocalRequestId(newRequestId);

        await router.replace(
            { pathname: router.pathname, query: newQuery },
            undefined,
            { shallow: true },
        );
    }, [router, setLocalRequestId]);

    const handleStaleRequestId = useStaleHotelSearchRefresh({
        hotelId,
        isReady: router.isReady,
        setLocalRequestId,
        onSearchRefreshed: () => setRoomsSearchKey((key) => key + 1),
    });

    const initialSearchParams = useInitialSearchParams();
    const searchType = router.isReady ? getSearchTypeFromQuery(router.query) : 'package';
    const { hotel, apiHotelData, loading: hotelLoading } = useHotelDetails(
        hotelId,
        router.isReady,
        searchType
    );
    const { rooms, roomFilters, loading: roomsLoading } = useHotelRooms(
        requestId,
        hotelId,
        router.isReady,
        roomsSearchKey,
        { onRequestIdStale: handleStaleRequestId },
    );

    const {
        reviews,
        loading: reviewsLoading,
        loadingMore: reviewsLoadingMore,
        hasMore: reviewsHasMore,
        error: reviewsError,
        hotelRating,
        loadMore: loadMoreReviews,
    } = useHotelReviews(hotelId, router.isReady);

    const searchHotelItem = useSelector((state: RootState) =>
        (state.search.allMyHotels || []).find(
            (item: { hotel?: { id?: number | string } }) =>
                String(item?.hotel?.id) === String(hotelId),
        ),
    );

    const displayHotel = useMemo(() => {
        if (!hotel) return null;
        const meta = resolveHotelDisplayMeta(hotel, {
            queryReviewsCount: router.query.reviews_count,
            queryRating: router.query.rating,
            searchHotelItem,
            reviewsApiRating: hotelRating,
            loadedReviewsCount: reviews.length,
        });
        return { ...hotel, ...meta };
    }, [hotel, router.query.reviews_count, router.query.rating, searchHotelItem, hotelRating, reviews.length]);

    // Run initial search if needed (when coming from hot deals without request_id)
    useInitialHotelSearch(hotelId, requestId, localRequestId, router.isReady, setLocalRequestId);

    useEffect(() => {
        if (initialSearchParams?.start_date) {
            setActiveStartDate(initialSearchParams.start_date);
            return;
        }
        if (queryStartDate) {
            setActiveStartDate(queryStartDate);
        }
    }, [initialSearchParams?.start_date, queryStartDate]);

    useEffect(() => {
        if (!router.isReady) return;
        const flexRaw = Array.isArray(router.query.flex_dates)
            ? router.query.flex_dates[0]
            : router.query.flex_dates;
        if (flexRaw != null && flexRaw !== '') return;

        router.replace(
            {
                pathname: router.pathname,
                query: {
                    ...router.query,
                    flex_dates: String(HOTEL_DETAILS_DEFAULT_FLEX_DATES),
                },
            },
            undefined,
            { shallow: true },
        );
    }, [router.isReady, router.query.flex_dates, router.pathname, router.query, router]);

    const urlRequestId = Array.isArray(router.query.request_id)
        ? router.query.request_id[0]
        : router.query.request_id;
    const prevUrlRequestIdRef = useRef<string | undefined>(undefined);

    // Reload rooms when URL request_id changes (browser back/forward).
    useEffect(() => {
        if (!router.isReady || !urlRequestId) return;
        if (prevUrlRequestIdRef.current === urlRequestId) return;
        prevUrlRequestIdRef.current = urlRequestId;
        setLastSearchSnapshot(null);
        setRoomsSearchKey((key) => key + 1);
    }, [router.isReady, urlRequestId]);

    const roomDepartureDate = useMemo(
        () =>
            activeStartDate ||
            lastSearchSnapshot?.startDateISO ||
            getSearchStartDateFromQuery(router.query) ||
            undefined,
        [activeStartDate, lastSearchSnapshot?.startDateISO, router.query],
    );

    const roomFlexDates = useMemo(
        () =>
            lastSearchSnapshot?.flexDates ??
            parseFlexDatesValue(
                Array.isArray(router.query.flex_dates)
                    ? router.query.flex_dates[0]
                    : router.query.flex_dates,
                HOTEL_DETAILS_DEFAULT_FLEX_DATES,
            ),
        [lastSearchSnapshot?.flexDates, router.query.flex_dates],
    );

    useEffect(() => {
        const dates = getAvailableDepartureDatesForHotelRooms(
            rooms,
            router.query,
            HOTEL_DETAILS_DEFAULT_FLEX_DATES,
            {
                startDate: roomDepartureDate,
                flexDates: roomFlexDates,
            },
        );
        if (!dates.length) return;

        const searchChanged = prevActiveStartRef.current !== activeStartDate;
        prevActiveStartRef.current = activeStartDate;

        const preferredDate = roomDepartureDate;

        setSelectedRoomDate((prev) => {
            if (searchChanged && preferredDate && dates.includes(preferredDate)) {
                return preferredDate;
            }
            if (prev && dates.includes(prev)) return prev;
            if (preferredDate && dates.includes(preferredDate)) return preferredDate;
            return dates[Math.floor(dates.length / 2)] ?? dates[0];
        });
    }, [rooms, activeStartDate, router.query, roomDepartureDate, roomFlexDates]);

    // Wait for router to be ready before checking hotelId
    if (!router.isReady) {
        return (
            <main className={'searchContainer'}>
                <Steps activeStep="hotel" />
                <HotelDetailsSkeleton />
            </main>
        );
    }

    // Show loading if hotelId is missing (shouldn't happen if navigation is correct)
    if (!hotelId) {
        return (
            <main className={'searchContainer'}>
                <Steps activeStep="hotel" />
                <HotelDetailsSkeleton />
            </main>
        );
    }

    if (hotelLoading || !hotel) {
        return (
            <main className={'searchContainer'}>
                <Steps activeStep="hotel" />
                <HotelDetailsSkeleton />
            </main>
        );
    }

    const hotelTitle = hotel?.name
        ? `${hotel.name as string} — отель | ${SITE_NAME}`
        : null;
    const hotelDesc =
        hotel?.name &&
        `Отель «${hotel.name as string}»: номера, удобства и бронирование на ${SITE_NAME}.`;

    return (
        <main className={'searchContainer'}>
            {hotelTitle ? (
                <Head>
                    <title>{hotelTitle}</title>
                    {hotelDesc ? <meta name="description" content={hotelDesc} /> : null}
                    <meta
                        name="keywords"
                        content={`${hotel.name as string}, Totus Club, отель, бронирование, номера, тур`}
                    />
                    <meta property="og:title" content={hotelTitle} />
                    {hotelDesc ? <meta property="og:description" content={hotelDesc} /> : null}
                </Head>
            ) : null}
            <Steps activeStep="hotel" />
            <HotelDetailsHeader
                info={displayHotel ?? hotel}
                loading={hotelLoading}
                onReviewsClick={() => setReviewsModalOpen(true)}
            />
            <HotelReviewsModal
                isOpen={reviewsModalOpen}
                onClose={() => setReviewsModalOpen(false)}
                reviews={reviews}
                loading={reviewsLoading}
                loadingMore={reviewsLoadingMore}
                hasMore={reviewsHasMore}
                error={reviewsError}
                reviewsCount={displayHotel?.reviews_count ?? 0}
                rating={displayHotel?.rating ?? 0}
                onLoadMore={loadMoreReviews}
            />
            <HotelDetailsInfo
                hotel={hotel}
                hotelId={hotelId}
                rooms={rooms}
                panding={roomsLoading}
                images={hotel?.images || apiHotelData?.images || []}
                selectedRoomDate={selectedRoomDate}
            />
            <HotelDetailsDesc loading={hotelLoading} info={hotel} />
            <HotelSearchSection
                hotelId={hotelId}
                apiHotelData={apiHotelData}
                onSearchComplete={handleSearchComplete}
                initialSearchParams={initialSearchParams}
                searchSessionKey={requestId ?? urlRequestId ?? null}
            />
            <HotelDetailsRooms
                rooms={rooms}
                roomFilters={roomFilters}
                loading={roomsLoading}
                selectedDate={selectedRoomDate}
                onSelectedDateChange={setSelectedRoomDate}
                departureDate={roomDepartureDate}
                flexDates={roomFlexDates}
                hotelMap={{
                    lat: hotel?.lat,
                    long: hotel?.long,
                    lng: hotel?.lng,
                    address: hotel?.address,
                    name: hotel?.name,
                    fallbackImage: hotel?.location_image?.webp || hotel?.location_image?.png,
                }}
            />
        </main>
    );
}
