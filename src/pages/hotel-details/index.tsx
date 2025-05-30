import Steps from "@/components/searchPage/steps";
import HotelDetailsHeader from "@/components/hotelDetails/hotelDetailsHeader";
import HotelDetailsInfo from "@/components/hotelDetails/hotelDetailsInfo";
import HotelDetailsDesc from "@/components/hotelDetails/hotelDetailsDesc";
import HotelDetailsRooms from "@/components/hotelDetails/hotelDetailsRooms";
import HotelDetailsServices from "@/components/hotelDetails/hotelDetailsRooms/services";
import {useEffect, useState} from "react";
import {getHotelOffers, runFullSearchFlow} from "@/api/levelTravelApi";

export default function HotelDetails() {
    const [hotels, setHotels] = useState([]);
    const [loading, setLoading] = useState(false);
    //
    // const handleSearch = async () => {
    //     setLoading(true);
    //     try {
    //         const results = await runFullSearchFlow({
    //             from_city: 'Moscow',
    //             to_country: 'EG',
    //             nights: 7,
    //             adults: 2,
    //             start_date: '30.07.2025',
    //         }, (status) => {
    //             console.log('Status:', status);
    //         });
    //
    //         setHotels(results);
    //         console.log(results.hotels[120].hotel.id)
    //         if(results){
    //             const data = await getHotelOffers({
    //                 request_id: 'MjEzfDIyNXwwfDEwNTZ8fDIwMjUtMDctMzAsMjAyNS0wNy0zMHwwfDcsN3wyfDB8fHwwfDB8fHwxMjUz',
    //                 hotel_id: +results.hotels[100].hotel.id,
    //                 compact: true,
    //             });
    //             console.log(data)
    //         }
    //
    //
    //     } catch (err) {
    //         console.error('Search failed:', err);
    //     } finally {
    //         setLoading(false);
    //     }
    // };

    // useEffect(() => {
    //     handleSearch()
    // },[])

    return (
        <main className={'searchContainer'}>
            <Steps active={2}/>
            <div className={'content'}>
                 <HotelDetailsHeader/>
                 <HotelDetailsInfo/>
                 <HotelDetailsDesc/>
                 <HotelDetailsRooms/>
                 <HotelDetailsServices/>
            </div>
        </main>
    );
}
