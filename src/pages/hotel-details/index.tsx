import Steps from "@/components/searchPage/steps";
import HotelDetailsHeader from "@/components/hotelDetails/hotelDetailsHeader";
import HotelDetailsInfo from "@/components/hotelDetails/hotelDetailsInfo";
import HotelDetailsDesc from "@/components/hotelDetails/hotelDetailsDesc";
import HotelDetailsRooms from "@/components/hotelDetails/hotelDetailsRooms";
import HotelDetailsServices from "@/components/hotelDetails/hotelDetailsRooms/services";
import {useEffect, useState} from "react";
import {createPackage, getHotelInfo, getHotelOffers, getHotelRooms, runFullSearchFlow} from "@/api/levelTravelApi";
import {router} from "next/client";

export default function HotelDetails() {
    const [hotel, setHotel] = useState(null);
    const [rooms, setRooms] = useState([]);
    const [loading, setLoading] = useState(false);
    //
    const handleSearch = async (roomParans) => {
        setLoading(true);
        try {
           const allRooms = await getHotelRooms(roomParans)
           const hotelInfo = await getHotelInfo(roomParans)
            setHotel(hotelInfo)
            setRooms(allRooms?.result)
            console.log('hotelInfo',hotelInfo)
            console.log('allRooms',allRooms)
        } catch (err) {
            console.error('Search failed:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (router?.isReady && router?.query?.hotel_id) {
            console.log('router.query',router.query)
            handleSearch(router.query)
            // getHotelInfo(router.query)
        }

    },[router?.isReady,router?.query])



    return (
        <main className={'searchContainer'}>
            <Steps active={2}/>
            {/*<div className={'content'}>*/}
                 <HotelDetailsHeader info={hotel}/>
                 <HotelDetailsInfo rooms={rooms} images={hotel?.images || []} />
                 <HotelDetailsDesc info={hotel} />
                 <HotelDetailsRooms  rooms={rooms}/>
                 {/*<HotelDetailsServices info={hotel}/>*/}
            {/*</div>*/}
        </main>
    );
}
