import styles from '../hotelDetails.module.css';
import {useEffect, useState} from "react";

interface DatesPriceItem {
    date: string | Date;
    price: number | string;
}

interface DatesPriceProps {
    dates: DatesPriceItem[];
    selectedDate:string,
    setSelectedDate:any
}

function formatDateToRussian(date: Date): string {
    const day = date.getDate();

    const monthFormatter = new Intl.DateTimeFormat('ru-RU', { month: 'short' });
    const weekdayFormatter = new Intl.DateTimeFormat('ru-RU', { weekday: 'short' });

    const month = monthFormatter.format(date); // e.g., "мая"
    const weekday = weekdayFormatter.format(date); // e.g., "чт"

    return `${day} ${month}, ${weekday}`;
}
const DatesPrice = ({ dates,selectedDate, setSelectedDate }: DatesPriceProps) => {


    useEffect(() => {
        // setSelectedDate(dates[0]['date']);
        const firstEntry = Object.entries(dates)[0];
        if (firstEntry) {
            const [firstDate, firstPrice] = firstEntry;
            setSelectedDate(firstDate)
            // console.log(firstDate); // "2025-07-19"
        }
    },[dates])

    const handleDateChange = (date: Date) => {
        setSelectedDate(date);
    }
    return (
        <>
            <div className={styles.HotelDetailsDatePrices}>
                {Object.entries(dates)?.map(([date, price], index) => (
                    <div
                        onClick={() => handleDateChange(date)}
                        className={styles.HotelDetailsDatePrice}
                        style={{
                            backgroundColor: `var(${
                                selectedDate === date ? '--core_Orange' : '--bgSecondary'
                            })`,
                        }}
                        key={index}
                    >
                        <p
                            style={{
                                color: `var(${
                                    selectedDate === date ? '--textPrimaryB' : '--textPrimary'
                                })`,
                            }}
                        >
                            {formatDateToRussian(new Date(date))}
                        </p>
                        <p
                            style={{
                                color: `var(${
                                    selectedDate === date ? '--textPrimaryB' : '--textTertiary'
                                })`,
                            }}
                        >
                            от {price} ₽
                        </p>
                    </div>
                ))}

            </div>
            <div className={styles.HotelDetailsDatePricesMob}>
                <div className={styles.HotelDetailsDatePricesMobRows}>
                    {Object.entries(dates)?.map(([date, price], index) => (
                        <div
                            onClick={() => handleDateChange(date)}
                            className={styles.HotelDetailsDatePriceMob}
                            style={{
                                backgroundColor: `var(${
                                    selectedDate === date ? '--core_Orange' : '--bgSecondary'
                                })`,
                            }}
                            key={index}
                        >
                            <p
                                style={{
                                    color: `var(${
                                        selectedDate === date ? '--textPrimaryB' : '--textPrimary'
                                    })`,
                                }}
                            >
                                {formatDateToRussian(new Date(date))}
                            </p>
                            <p
                                style={{
                                    color: `var(${
                                        selectedDate === date ? '--textPrimaryB' : '--textTertiary'
                                    })`,
                                }}
                            >
                                от {price} ₽
                            </p>
                        </div>
                    ))}
                </div>

            </div>
        </>
    );
};

export default DatesPrice;
