import React, { useState, useEffect, useRef } from 'react';
import {
    addDays,
    subMonths,
    addMonths,
    format,
    startOfWeek,
    startOfMonth,
    endOfMonth,
    endOfWeek,
    isSameDay,
    isSameMonth,
    differenceInCalendarDays,
    isBefore,
    startOfDay,
} from 'date-fns';
import { ru } from 'date-fns/locale';
import Icon from "@/components/icons/Icon";
import styles from './calendar.module.css'
import SwitchToggle from "@/components/UI/switch";

interface CalendarProps {
    selectedDate: Date | null;
    setSelectedDate: (date: Date) => void;
    allowPastDates?: boolean; // If true, allows selecting past dates (for date of birth, etc.)
    hideToggle?: boolean; // If true, hides the ±2 days toggle
}


const Calendar = ({ selectedDate, setSelectedDate, allowPastDates = false, hideToggle = false }: CalendarProps) => {
    const [currentMonth, setCurrentMonth] = useState(new Date());
    const [showPlusMinus, setShowPlusMinus] = useState(false);
    const [showYearPicker, setShowYearPicker] = useState(false);
    const [showMonthPicker, setShowMonthPicker] = useState(false);
    const calendarRef = useRef<HTMLDivElement>(null);

    const today = startOfDay(new Date());

    // Close pickers when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (calendarRef.current && !calendarRef.current.contains(event.target as Node)) {
                setShowYearPicker(false);
                setShowMonthPicker(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    const isPlusMinusTwo = (date: Date) => {
        if (!selectedDate || isSameDay(date, selectedDate)) return false;
        const diff = Math.abs(differenceInCalendarDays(date, selectedDate));
        return diff <= 2;
    };

    const renderHeader = () => {
        const currentYear = currentMonth.getFullYear();
        const currentMonthIndex = currentMonth.getMonth();
        const years = [];
        const startYear = allowPastDates ? currentYear - 100 : currentYear - 10;
        const endYear = currentYear + 10;

        for (let year = startYear; year <= endYear; year++) {
            years.push(year);
        }

        const months = [
            'Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь',
            'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'
        ];

        return (
            <div className={styles.headerCalendar}>
                <button onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}>
                    <Icon name={'leftArrow'} size={24} color="var(--textPrimary)" />
                </button>
                <div className={styles.headerDatePicker}>
                    <button
                        className={styles.datePickerButton}
                        onClick={(e) => {
                            e.stopPropagation();
                            setShowMonthPicker(!showMonthPicker);
                            setShowYearPicker(false);
                        }}
                    >
                        {months[currentMonthIndex]}
                    </button>
                    <button
                        className={styles.datePickerButton}
                        onClick={(e) => {
                            e.stopPropagation();
                            setShowYearPicker(!showYearPicker);
                            setShowMonthPicker(false);
                        }}
                    >
                        {currentYear}
                    </button>
                    {showMonthPicker && (
                        <div className={styles.pickerDropdown} onClick={(e) => e.stopPropagation()}>
                            {months.map((month, index) => (
                                <div
                                    key={index}
                                    className={`${styles.pickerItem} ${index === currentMonthIndex ? styles.pickerItemActive : ''}`}
                                    onClick={() => {
                                        setCurrentMonth(new Date(currentYear, index, 1));
                                        setShowMonthPicker(false);
                                    }}
                                >
                                    {month}
                                </div>
                            ))}
                        </div>
                    )}
                    {showYearPicker && (
                        <div className={styles.pickerDropdown} onClick={(e) => e.stopPropagation()}>
                            <div className={styles.yearPickerContainer}>
                                {years.map((year) => (
                                    <div
                                        key={year}
                                        className={`${styles.pickerItem} ${year === currentYear ? styles.pickerItemActive : ''}`}
                                        onClick={() => {
                                            setCurrentMonth(new Date(year, currentMonthIndex, 1));
                                            setShowYearPicker(false);
                                        }}
                                    >
                                        {year}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
                <button onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}>
                    <Icon name={'rightArrow'} size={24} color="var(--textPrimary)" />
                </button>
            </div>
        );
    };

    const renderDays = () => {
        const days = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];
        return (
            <div className={styles.daysRow}>
                {days.map((day) => (
                    <div key={day} className={styles.dayName}>
                        {day}
                    </div>
                ))}
            </div>
        );
    };

    const renderCells = () => {
        const monthStart = startOfMonth(currentMonth);
        const monthEnd = endOfMonth(monthStart);
        const startDate = startOfWeek(monthStart, { locale: ru, weekStartsOn: 1 });
        const endDate = endOfWeek(monthEnd, { locale: ru, weekStartsOn: 1 });

        const rows = [];
        let days = [];
        let day = startDate;

        while (day <= endDate) {
            for (let i = 0; i < 7; i++) {
                const currentDay = day;
                const isSelected = selectedDate && isSameDay(currentDay, selectedDate);
                const isInRange = showPlusMinus && isPlusMinusTwo(currentDay);
                const isCurrentMonth = isSameMonth(currentDay, currentMonth);
                const isDisabled = !allowPastDates && isBefore(currentDay, today);

                let backgroundColor = 'transparent';
                if (isSelected) backgroundColor = 'var(--core_Orange)';
                else if (isInRange) backgroundColor = 'var(--bgSecondary)';

                days.push(
                    <div
                        key={currentDay.toString()}
                        onClick={!isDisabled ? () => setSelectedDate(new Date(currentDay)) : undefined}
                        className={styles.cell}
                        style={{
                            backgroundColor,
                            color: isCurrentMonth
                                ? isDisabled
                                    ? 'var(--textDisabled)'
                                    : isSelected ? 'var(--textPrimaryB)' : 'var(--textPrimary)'
                                : 'var(--textTertiary)',
                            fontWeight: isSelected ? 'bold' : 'normal',
                            cursor: isDisabled ? 'not-allowed' : 'pointer',
                            opacity: isDisabled ? 0.5 : 1,
                            borderRadius: isSelected ? 24 : 0,
                        }}
                    >
                        {format(currentDay, 'd')}
                    </div>
                );

                day = addDays(day, 1);
            }

            rows.push(
                <div key={day.toString() + '_row'} className={styles.weekRow}>
                    {days}
                </div>
            );
            days = [];
        }

        return <div>{rows}</div>;
    };

    return (
        <div className={styles.calendarWrapper} ref={calendarRef}>
            {renderHeader()}
            {renderDays()}
            {renderCells()}
            {!hideToggle && (
                <div className={styles.toggleRow}>
                    <p>±2 дня</p>
                    <SwitchToggle isOn={showPlusMinus} setIsOn={setShowPlusMinus} />
                </div>
            )}
        </div>
    );
};


export default Calendar;
