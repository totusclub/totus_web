import styles from '../hotelDetails.module.css';
import { useEffect, useMemo } from "react";
import { formatPriceFromLabel } from '@/utils/formatPrice';

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

    const dateTabs = useMemo(
        () =>
            Object.entries(dates || {}).map(([date, price]) => ({
                date,
                label: formatDateToRussian(new Date(date)),
                priceLabel: formatPriceFromLabel(price),
            })),
        [dates],
    );

    return (
        <>
            <div className={styles.HotelDetailsDatePrices}>
                {dateTabs.map(({ date, label, priceLabel }, index) => (
                    <div
                        onClick={() => handleDateChange(date)}
                        className={styles.HotelDetailsDatePrice}
                        style={{
                            backgroundColor: `var(${
                                selectedDate === date ? '--core_Orange' : '--bgSecondary'
                            })`,
                        }}
                        key={date || index}
                    >
                        <p
                            style={{
                                color: `var(${
                                    selectedDate === date ? '--textPrimaryB' : '--textPrimary'
                                })`,
                            }}
                        >
                            {label}
                        </p>
                        <p
                            className={styles.HotelDetailsDatePriceValue}
                            style={{
                                color: `var(${
                                    selectedDate === date ? '--textPrimaryB' : '--textTertiary'
                                })`,
                            }}
                        >
                            {priceLabel}
                        </p>
                    </div>
                ))}

            </div>
            <div className={styles.HotelDetailsDatePricesMob}>
                <div className={styles.HotelDetailsDatePricesMobRows}>
                    {dateTabs.map(({ date, label, priceLabel }, index) => (
                        <div
                            onClick={() => handleDateChange(date)}
                            className={styles.HotelDetailsDatePriceMob}
                            style={{
                                backgroundColor: `var(${
                                    selectedDate === date ? '--core_Orange' : '--bgSecondary'
                                })`,
                            }}
                            key={date || index}
                        >
                            <p
                                style={{
                                    color: `var(${
                                        selectedDate === date ? '--textPrimaryB' : '--textPrimary'
                                    })`,
                                }}
                            >
                                {label}
                            </p>
                            <p
                                className={styles.HotelDetailsDatePriceValue}
                                style={{
                                    color: `var(${
                                        selectedDate === date ? '--textPrimaryB' : '--textTertiary'
                                    })`,
                                }}
                            >
                                {priceLabel}
                            </p>
                        </div>
                    ))}
                </div>

            </div>
        </>
    );
};

export default DatesPrice;
