import styles from '../hotelDetails.module.css';
import {useEffect, useState} from "react";

interface DatesPriceItem {
    date: string | Date;
    price: number | string;
}

interface DatesPriceProps {
    dates: DatesPriceItem[];
}

function formatDateToRussian(date: Date): string {
    const day = date.getDate();

    const monthFormatter = new Intl.DateTimeFormat('ru-RU', { month: 'long' });
    const weekdayFormatter = new Intl.DateTimeFormat('ru-RU', { weekday: 'short' });

    const month = monthFormatter.format(date); // e.g., "мая"
    const weekday = weekdayFormatter.format(date); // e.g., "чт"

    return `${day} ${month}, ${weekday}`;
}
const DatesPrice = ({ dates }: DatesPriceProps) => {
    const [selectedDate, setSelectedDate] = useState<Date | null>(null);

    useEffect(() => {
        setSelectedDate(dates[0]['date']);
    },[dates])

    const handleDateChange = (date: Date) => {
        setSelectedDate(date);
    }
    return (
        <div className={styles.HotelDetailsDatePrices}>
            {dates.map((item, index) => (
                <div onClick={()=>handleDateChange(item.date)} className={styles.HotelDetailsDatePrice} style={{backgroundColor:`var(${selectedDate===item.date?'--core_Orange':'--bgSecondary'})`}} key={index}>
                    <p style={{color:`var(${selectedDate===item.date?'--textPrimaryB':'--textPrimary'})`}} >{formatDateToRussian(item.date)}</p>
                    <p style={{color:`var(${selectedDate===item.date?'--textPrimaryB':'--textTertiary'})`}}>от {item.price} ₽</p>
                </div>
            ))}
        </div>
    );
};

export default DatesPrice;
