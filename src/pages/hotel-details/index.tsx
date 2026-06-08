import Head from 'next/head';
import Steps from "@/components/searchPage/steps";
import HotelDetailsHeader from "@/components/hotelDetails/hotelDetailsHeader";
import HotelDetailsInfo from "@/components/hotelDetails/hotelDetailsInfo";
import HotelDetailsDesc from "@/components/hotelDetails/hotelDetailsDesc";
import HotelDetailsRooms from "@/components/hotelDetails/hotelDetailsRooms";
import HotelDetailsSkeleton from "@/components/hotelDetails/hotelDetailsSkeleton";
import HotelSearchSection from "@/components/hotelDetails/hotelSearchSection";
import HotelReviewsModal from "@/components/hotelDetails/HotelReviewsModal";
import { useRouter } from "next/router";
import { useHotelDetails } from "@/hooks/useHotelDetails";
import { useHotelReviews } from "@/hooks/useHotelReviews";
import { useHotelRooms } from "@/hooks/useHotelRooms";
import { useInitialHotelSearch } from "@/hooks/useInitialHotelSearch";
import { useRequestIdSync } from "@/hooks/useRequestIdSync";
import { useInitialSearchParams } from "@/hooks/useInitialSearchParams";
import { SITE_NAME } from "@/config/seo";
import { getAvailableStartDatesFromRooms, resolveHotelDisplayMeta } from "@/utils/hotelDetailsUtils";
import { getSearchTypeFromQuery } from "@/utils/bookingFlowUtils";
import { endYmdAfterNights } from "@/utils/calendarDateRange";
import { useEffect, useMemo, useRef, useState } from "react";
import { useSelector } from "react-redux";
import type { RootState } from "@/store";

export default function HotelDetails() {
    const router = useRouter();
    const hotelId = router.query.hotel_id as string;
    const queryStartDate = Array.isArray(router.query.start_date)
        ? router.query.start_date[0]
        : router.query.start_date;
    const [activeStartDate, setActiveStartDate] = useState<string | undefined>(undefined);
    const [selectedRoomDate, setSelectedRoomDate] = useState<string>("");
    const [reviewsModalOpen, setReviewsModalOpen] = useState(false);
    const prevActiveStartRef = useRef<string | undefined>(undefined);

    // Hooks for data fetching and state management
    const { requestId, localRequestId, setLocalRequestId } = useRequestIdSync();
    const initialSearchParams = useInitialSearchParams();
    const searchType = router.isReady ? getSearchTypeFromQuery(router.query) : 'package';
    const { hotel, apiHotelData, loading: hotelLoading } = useHotelDetails(
        hotelId,
        router.isReady,
        searchType
    );
    const { rooms, loading: roomsLoading } = useHotelRooms(requestId, hotelId, router.isReady);

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

    const handleSearchComplete = (newRequestId: string) => {
        setLocalRequestId(newRequestId);
        const newQuery = { ...router.query, request_id: newRequestId };
        router.replace(
            { pathname: router.pathname, query: newQuery },
            undefined,
            { shallow: true }
        );
    };

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
        const dates = getAvailableStartDatesFromRooms(rooms);
        if (!dates.length) return;

        const searchChanged = prevActiveStartRef.current !== activeStartDate;
        prevActiveStartRef.current = activeStartDate;

        setSelectedRoomDate((prev) => {
            if (searchChanged && activeStartDate && dates.includes(activeStartDate)) {
                return activeStartDate;
            }
            if (prev && dates.includes(prev)) return prev;
            if (activeStartDate && dates.includes(activeStartDate)) return activeStartDate;
            return dates[0];
        });
    }, [rooms, activeStartDate]);

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
                onParamsChange={(snapshot) => {
                    if (snapshot?.startDateISO) {
                        setActiveStartDate(snapshot.startDateISO);

                        const startDateFrom = snapshot.startDateISO;
                        const nights = String(snapshot.nights || 1);
                        const endDateTill = endYmdAfterNights(startDateFrom, snapshot.nights || 1);

                        const currentStart = Array.isArray(router.query.start_date)
                            ? router.query.start_date[0]
                            : router.query.start_date;
                        const currentNights = Array.isArray(router.query.nights)
                            ? router.query.nights[0]
                            : router.query.nights;
                        const currentEnd = Array.isArray(router.query.end_date_till)
                            ? router.query.end_date_till[0]
                            : router.query.end_date_till;

                        if (
                            currentStart !== startDateFrom ||
                            currentNights !== nights ||
                            currentEnd !== endDateTill
                        ) {
                            router.replace(
                                {
                                    pathname: router.pathname,
                                    query: {
                                        ...router.query,
                                        start_date: startDateFrom,
                                        start_date_from: startDateFrom,
                                        nights,
                                        end_date_till: endDateTill,
                                    },
                                },
                                undefined,
                                { shallow: true }
                            );
                        }
                    }
                }}
            />
            <HotelDetailsRooms
                rooms={rooms}
                loading={roomsLoading}
                selectedDate={selectedRoomDate}
                onSelectedDateChange={setSelectedRoomDate}
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
