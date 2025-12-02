import Steps from "@/components/searchPage/steps";
import HotelDetailsHeader from "@/components/hotelDetails/hotelDetailsHeader";
import HotelDetailsInfo from "@/components/hotelDetails/hotelDetailsInfo";
import HotelDetailsDesc from "@/components/hotelDetails/hotelDetailsDesc";
import HotelDetailsRooms from "@/components/hotelDetails/hotelDetailsRooms";
import HotelDetailsSkeleton from "@/components/hotelDetails/hotelDetailsSkeleton";
import { useEffect, useState, useMemo } from "react";
import { getHotelInfo, getHotelRooms, startSearch } from "@/api/levelTravelApi";
import { useRouter } from "next/router";
import { useSelector } from "react-redux";
import { RootState } from "@/store";

// Helper function to get default start date (7 days from today)
const getDefaultStartDate = (): string => {
    const today = new Date();
    const plus7 = new Date();
    plus7.setDate(today.getDate() + 7);
    const year = plus7.getFullYear();
    const month = String(plus7.getMonth() + 1).padStart(2, '0');
    const day = String(plus7.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

export default function HotelDetails() {
    const router = useRouter();
    const { requestId: storeRequestId } = useSelector((state: RootState) => state.search);
    
    const [hotel, setHotel] = useState<any>(null);
    const [apiHotelData, setApiHotelData] = useState<any>(null);
    const [rooms, setRooms] = useState<any[]>([]);
    const [hotelLoading, setHotelLoading] = useState(true);
    const [roomsLoading, setRoomsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    
    // Local request_id state - can be updated independently from Redux store
    const initialRequestId = storeRequestId || null;
    const [localRequestId, setLocalRequestId] = useState<string | null>(null);

    // Get hotel_id from route params
    const hotelId = router.query.hotel_id as string;
    const existingRequestId = router.query.request_id as string;

    // Sync localRequestId with initialRequestId when it changes externally
    useEffect(() => {
        if (initialRequestId && initialRequestId !== localRequestId && !localRequestId) {
            setLocalRequestId(initialRequestId);
        }
    }, [initialRequestId, localRequestId]);

    // Use local request_id if available, otherwise fall back to Redux store or URL
    const requestId = useMemo(() => {
        return localRequestId || existingRequestId || initialRequestId;
    }, [localRequestId, existingRequestId, initialRequestId]);

    // Fetch hotel details (similar to useHotelDetails)
    useEffect(() => {
        const fetchHotelData = async () => {
            try {
                setHotelLoading(true);
                setError(null);

                if (!hotelId) {
                    console.warn('Invalid hotel ID');
                    setHotelLoading(false);
                    return;
                }

                const parsedHotelId = parseInt(hotelId, 10);
                if (isNaN(parsedHotelId)) {
                    console.warn('Invalid hotel ID');
                    setHotelLoading(false);
                    return;
                }

                const params = {
                    hotel_ids: parsedHotelId,
                    search_type: 'package',
                };

                const hotelInfo = await getHotelInfo({ hotel_id: parsedHotelId });
                setApiHotelData(hotelInfo);
                setHotel(hotelInfo);
            } catch (err: any) {
                console.error('Error fetching hotel data:', err);
                setError(err.message || 'Failed to fetch hotel data');
            } finally {
                setHotelLoading(false);
            }
        };

        if (router.isReady && hotelId) {
            fetchHotelData();
        }
    }, [router.isReady, hotelId]);

    // Handle initial search if we have searchParams but no request_id (similar to useInitialHotelSearch)
    useEffect(() => {
        if (!router.isReady || !hotelId) return;
        
        // If we already have request_id, don't start a new search
        if (requestId || localRequestId) {
            return;
        }

        // Check if we have search params in URL
        const query = router.query;
        const hasSearchParams = query.from_city || query.start_date || query.adults;

        if (!hasSearchParams) {
            return;
        }

        let isMounted = true;

        const runInitialSearch = async () => {
            try {
                const searchParams = {
                    from_city: (query.from_city as string) || "Moscow",
                    from_country: (query.from_country as string) || "RU",
                    to_country: query.to_country as string || "RU",
                    to_city: query.to_city === 'null' || query.to_city === '' ? undefined : (query.to_city as string),
                    adults: (query.adults as string) || "2",
                    kids: query.kids as string,
                    kids_ages: query.kids_ages ? (Array.isArray(query.kids_ages) ? query.kids_ages.map(Number) : [Number(query.kids_ages)]) : undefined,
                    start_date: (query.start_date as string) || getDefaultStartDate(),
                    nights: (query.nights as string) || "7",
                    search_type: (query.search_type as string) || "package",
                    flex_dates: query.flex_dates ? Number(query.flex_dates) : 2,
                    hotel_ids: [Number(hotelId)],
                    page_number: 1,
                    page_limit: 20,
                    sort_by: (query.sort_by as string) || "relevance"
                };

                const response = await startSearch(searchParams);
                console.log('runInitialSearch', response);

                if (isMounted && response?.request_id) {
                    setLocalRequestId(response.request_id);
                    // Update URL with request_id without reloading
                    const newQuery = { ...query, request_id: response.request_id };
                    router.replace({ pathname: router.pathname, query: newQuery }, undefined, { shallow: true });
                }
            } catch (error) {
                console.error('Failed to start hotel search from params', error);
            }
        };

        runInitialSearch();

        return () => {
            isMounted = false;
        };
    }, [router.isReady, router.query, hotelId, requestId, localRequestId]);

    // Fetch hotel rooms when we have request_id and hotel_id (similar to useHotelRooms)
    useEffect(() => {
        if (!router.isReady || !requestId || !hotelId) return;

        const fetchRooms = async () => {
            setRoomsLoading(true);
            try {
                const roomParams = {
                    request_id: requestId,
                    hotel_id: hotelId
                };

                const allRooms = await getHotelRooms(roomParams);
                setRooms(allRooms?.result || []);
            } catch (err) {
                console.error('Failed to fetch hotel rooms:', err);
            } finally {
                setRoomsLoading(false);
            }
        };

        fetchRooms();
    }, [router.isReady, requestId, hotelId]);

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
            <HotelDetailsRooms rooms={rooms} />
        </main>
    );
}
