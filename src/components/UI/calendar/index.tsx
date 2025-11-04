import React, { useState } from 'react';
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
}


const Calendar = ({selectedDate,setSelectedDate}:CalendarProps) => {
    const [currentMonth, setCurrentMonth] = useState(new Date());
    const [showPlusMinus, setShowPlusMinus] = useState(false);

    const today = startOfDay(new Date());

    const isPlusMinusTwo = (date: Date) => {
        if (!selectedDate || isSameDay(date, selectedDate)) return false;
        const diff = Math.abs(differenceInCalendarDays(date, selectedDate));
        return diff <= 2;
    };

    const renderHeader = () => (
        <div className={styles.headerCalendar}>
            <button onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}>
               <Icon name={'leftArrow'} size={24} color="#000"/>
            </button>
            <p>{format(currentMonth, 'LLLL yyyy', { locale: ru })}</p>
            <button onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}>
                <Icon name={'rightArrow'} size={24} color="#000"/>
            </button>
        </div>
    );

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
                const isDisabled = isBefore(currentDay, today);

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
                                    ? '#aaa'
                                    : isSelected?'#fff':'#000'
                                : '#ccc',
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
        <div className={styles.calendarWrapper}>
            {renderHeader()}
            {renderDays()}
            {renderCells()}
            <div className={styles.toggleRow}>
                <p>±2 дня</p>
                <SwitchToggle isOn={showPlusMinus} setIsOn={setShowPlusMinus}/>
            </div>
        </div>
    );
};


export default Calendar;
