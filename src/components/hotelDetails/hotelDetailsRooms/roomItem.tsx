import styles from '../hotelDetails.module.css';
import TourAgents from "@/components/hotelDetails/hotelDetailsRooms/tourAgents";
import Icon from "@/components/icons/Icon";
import HotelDetailsPriceList from "@/components/hotelDetails/hotelDetailsRooms/priceList";
import SmallSlider from "@/components/UI/smallSlide";
import Image from "next/image";
import {useEffect, useMemo, useState} from "react";

const HotelDetailsRoomItem = ({item,selectedDate}:any) => {
    const [selectedOperator, setSelectedOperator] = useState<number | null>(null);

   const roomItems =  useMemo(() => {
        if (selectedDate && item?.offers) {
            const filteredOffers = Object.entries(item.offers)
                .flatMap(([type, offers]) =>
                    offers
                        .filter(offer => offer.start_date === selectedDate)
                        .map(offer => ({ type, ...offer }))
                );

            const seen = new Set();
            const uniqueOperators = filteredOffers.filter(offer => {
                if (seen.has(offer.operator_id)) return false;
                seen.add(offer.operator_id);
                return true;
            });

            const simplified = uniqueOperators.map(offer => ({
                id: offer.operator_id,
                name: offer.operator_name
            }));

            console.log('Filtered Offers:', selectedDate, filteredOffers, simplified);
            setSelectedOperator(simplified[0]?.['id'])
            return {offersRoom:filteredOffers,operators:simplified}
        }
    }, [selectedDate, item?.offers]);




    return (
        <div className={styles.HotelDetailsRoomItem}>
            <div className={styles.HotelDetailsRoom}>
                {item?.room?.images?.length > 1 ? (
                    <SmallSlider images={item?.room?.images}/>
                ) : (
                    <div className={styles.HotelDetailsRoomImage}>
                        <img alt={'imag'}
                             src={'https://www.staysomedays.com/wp-content/uploads/2021/12/hotel-grof-800x800.jpg'}/>
                    </div>
                )}

                <div className={styles.HotelDetailsRoomInforamation}>
                    <p>{item?.room?.name_ru}</p>
                    <div className={styles.HotelDetailsRoomOptions}>
                        <div className={styles.HotelDetailsRoomOption}>
                            <Icon name={'verify'}/>
                            <p>Без питания, завтрак, завтрак и обед или ужин</p>
                        </div>
                        <div className={styles.HotelDetailsRoomOption}>
                            <Icon name={'light'}/>
                            <p>Быстрое подтверждение</p>
                        </div>
                    </div>

                </div>
            </div>

            <TourAgents agents={roomItems?.operators} selectedOperator={selectedOperator} setSelectedOperator={setSelectedOperator}/>

            {Object.entries(item?.offers)?.map(([type, offer], index) =>
                    <HotelDetailsPriceList key={index} selectedOperator={selectedOperator} selectedDate={selectedDate} item={roomItems?.offersRoom} type={type}  />
            )}


        </div>
    );
};

export default HotelDetailsRoomItem;
