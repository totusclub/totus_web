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

export default function HotelDetails() {
    const router = useRouter();
    const hotelId = router.query.hotel_id as string;

    // Hooks for data fetching and state management
    const { requestId, localRequestId, setLocalRequestId } = useRequestIdSync();
    const initialSearchParams = useInitialSearchParams();
    const { hotel, apiHotelData, loading: hotelLoading } = useHotelDetails(hotelId, router.isReady);
    const { rooms, loading: roomsLoading } = useHotelRooms(requestId, hotelId, router.isReady);

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

    return (
        <main className={'searchContainer'}>
            <Steps active={2} />
            <HotelDetailsHeader info={hotel} loading={hotelLoading} />
            <HotelDetailsInfo rooms={rooms} panding={roomsLoading} images={hotel?.images || apiHotelData?.images || []} />
            <HotelDetailsDesc loading={hotelLoading} info={hotel} />
            <HotelSearchSection
                hotelId={hotelId}
                apiHotelData={apiHotelData}
                onSearchComplete={handleSearchComplete}
                initialSearchParams={initialSearchParams}
            />
            <HotelDetailsRooms rooms={rooms} loading={roomsLoading} />
        </main>
    );
}
