import styles from '../hotelDetails.module.css';
import { useEffect } from "react";

interface DatesPriceProps {
    dates: Record<string, number | string>;
    selectedDate: string;
    setSelectedDate: (date: string) => void;
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
        const dateKeys = Object.keys(dates || {});
        if (dateKeys.length === 0) return;

        // Select first tab by default, and recover if current selection disappears
        if (!selectedDate || !dateKeys.includes(selectedDate)) {
            setSelectedDate(dateKeys[0]);
        }
    }, [dates, selectedDate, setSelectedDate]);

    const handleDateChange = (date: string) => {
        setSelectedDate(date);
    };
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
