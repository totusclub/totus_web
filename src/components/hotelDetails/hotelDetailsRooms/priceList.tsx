import styles from '../hotelDetails.module.css';
import Button from "@/components/UI/button";
import { useRouter } from "next/router";
import React from "react";

interface RoomItem {
    date: string;
    tourAgent: string;
    price: string | number;
}

interface HotelDetailsItem {
    title: string;
    description: string;
    items: RoomItem[];
}

interface HotelDetailsPriceListProps {
    item: HotelDetailsItem;
}

const HotelDetailsPriceList: React.FC<HotelDetailsPriceListProps> = ({ item }) => {
    const router = useRouter();

    const handleBook = () => {
        router.push("/tickets");
    };

    return (
        <div className={styles.HotelDetailsPriceList}>
            <div className={styles.HotelDetailsPriceListHead}>
                <p>{item.title}</p>
                {item.description.length > 1 && <p>{item.description}</p>}
            </div>
            <div className={styles.HotelDetailsPriceListItems}>
                {item.items.map((room, index) => (
                    <div key={index} className={styles.HotelDetailsPriceListItem}>
                        <div>
                            <p>{room.date}</p>
                            <p>{room.tourAgent}</p>
                        </div>
                        <div>
                            <p>{room.price}</p>
                            <p>тур с перелётом</p>
                        </div>
                        <div>
                            <Button
                                onClick={handleBook}
                                width="148px"
                                height="40px"
                                full={false}
                                title="Выбрать"
                            />
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default HotelDetailsPriceList;
