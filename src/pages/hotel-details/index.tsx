import Steps from "@/components/searchPage/steps";
import HotelDetailsHeader from "@/components/hotelDetails/hotelDetailsHeader";
import HotelDetailsInfo from "@/components/hotelDetails/hotelDetailsInfo";
import HotelDetailsDesc from "@/components/hotelDetails/hotelDetailsDesc";
import HotelDetailsRooms from "@/components/hotelDetails/hotelDetailsRooms";
import HotelDetailsSkeleton from "@/components/hotelDetails/hotelDetailsSkeleton";
import { useEffect, useState } from "react";
import { getHotelInfo, getHotelRooms } from "@/api/levelTravelApi";
import { router } from "next/client";

export default function HotelDetails() {
    const [hotel, setHotel] = useState<any>(null);
    const [rooms, setRooms] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    //
    const handleSearch = async (roomParams: any) => {
        setLoading(true);
        try {
            const allRooms = await getHotelRooms(roomParams)
            const hotelInfo = await getHotelInfo(roomParams)
            setHotel(hotelInfo)
            setRooms(allRooms?.result)
            console.log('Hotel data loaded:', { hotelInfo, images: hotelInfo?.images });
        } catch (err) {
            console.error('Search failed:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (router?.isReady && router?.query?.hotel_id) {
            console.log('router.query', router.query)
            handleSearch(router.query)
        }
    }, [])



    return (
        <main className={'searchContainer'}>
            <Steps active={2} />
            {loading ? (
                <HotelDetailsSkeleton />
            ) : (
                <>
                    <HotelDetailsHeader info={hotel} loading={loading} />
                    <HotelDetailsInfo rooms={rooms} panding={loading} images={hotel?.images || []} />
                    <HotelDetailsDesc loading={loading} info={hotel} />
                    <HotelDetailsRooms rooms={rooms} />
                </>
            )}
        </main>
    );
}
