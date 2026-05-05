import Head from 'next/head';
import Steps from "@/components/searchPage/steps";
import HotelDetailsHeader from "@/components/hotelDetails/hotelDetailsHeader";
import HotelDetailsInfo from "@/components/hotelDetails/hotelDetailsInfo";
import HotelDetailsDesc from "@/components/hotelDetails/hotelDetailsDesc";
import HotelDetailsRooms from "@/components/hotelDetails/hotelDetailsRooms";
import HotelDetailsSkeleton from "@/components/hotelDetails/hotelDetailsSkeleton";
import HotelSearchSection from "@/components/hotelDetails/hotelSearchSection";
import { useRouter } from "next/router";
import { useHotelDetails } from "@/hooks/useHotelDetails";
import { useHotelRooms } from "@/hooks/useHotelRooms";
import { useInitialHotelSearch } from "@/hooks/useInitialHotelSearch";
import { useRequestIdSync } from "@/hooks/useRequestIdSync";
import { useInitialSearchParams } from "@/hooks/useInitialSearchParams";
import { SITE_NAME } from "@/config/seo";
import { getAvailableStartDatesFromRooms } from "@/utils/hotelDetailsUtils";
import { useEffect, useRef, useState } from "react";

export default function HotelDetails() {
    const router = useRouter();
    const hotelId = router.query.hotel_id as string;
    const queryStartDate = Array.isArray(router.query.start_date)
        ? router.query.start_date[0]
        : router.query.start_date;
    const [activeStartDate, setActiveStartDate] = useState<string | undefined>(undefined);
    const [selectedRoomDate, setSelectedRoomDate] = useState<string>("");
    const prevActiveStartRef = useRef<string | undefined>(undefined);

    // Hooks for data fetching and state management
    const { requestId, localRequestId, setLocalRequestId } = useRequestIdSync();
    const initialSearchParams = useInitialSearchParams();
    const { hotel, apiHotelData, loading: hotelLoading } = useHotelDetails(hotelId, router.isReady);
    const { rooms, loading: roomsLoading } = useHotelRooms(requestId, hotelId, router.isReady);

    const formatDateToISO = (date: Date) => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };

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
                <Steps active={2} />
                <HotelDetailsSkeleton />
            </main>
        );
    }

    // Show loading if hotelId is missing (shouldn't happen if navigation is correct)
    if (!hotelId) {
        return (
            <main className={'searchContainer'}>
                <Steps active={2} />
                <HotelDetailsSkeleton />
            </main>
        );
    }

    if (hotelLoading || !hotel) {
        return (
            <main className={'searchContainer'}>
                <Steps active={2} />
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
            <Steps active={2} />
            <HotelDetailsHeader info={hotel} loading={hotelLoading} />
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
                        const endDate = new Date(startDateFrom);
                        endDate.setDate(endDate.getDate() + (snapshot.nights || 1));
                        const endDateTill = formatDateToISO(endDate);

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
