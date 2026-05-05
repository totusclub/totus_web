import React, { useEffect, useMemo, useRef, useState } from 'react';
import styles from './search.module.css';
import Icon from "@/components/icons/Icon";
import Calendar from "@/components/UI/calendar";
import { differenceInCalendarDays, format } from "date-fns";
import { ru } from "date-fns/locale";
import Button from "@/components/UI/button";

type SelectDateProps = {
    handleChange: any;
    value: any;
    name: any;
    className?: string;
    nights?: string | number;
};

const SelectDate = ({ handleChange, value, name, className, nights = 1 }: SelectDateProps) => {
    const [selectedDate, setSelectedDate] = useState<Date | null>(new Date(value));
    const [selectedEndDate, setSelectedEndDate] = useState<Date | null>(null);
    const [isOpen, setIsOpen] = useState<boolean>(false);
    const [activePoint, setActivePoint] = useState<'start' | 'end'>('start');
    const wrapperRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const start = new Date(value);
        setSelectedDate(start);

        const parsedNights = Number(String(nights).split('..')[0]) || 1;
        const end = new Date(start);
        end.setDate(end.getDate() + parsedNights);
        setSelectedEndDate(end);
    }, [value, nights]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, []);

    const handleToggle = () => {
        setIsOpen(prev => !prev);
        setActivePoint('start');
    };

    const dateLabel = useMemo(() => {
        if (!selectedDate || !selectedEndDate) return '--.--.--';
        const start = format(selectedDate, 'd MMM', { locale: ru }).toLowerCase();
        const end = format(selectedEndDate, 'd MMM', { locale: ru }).toLowerCase();
        return `${start} - ${end}`;
    }, [selectedDate, selectedEndDate]);
    const syncRange = (start: Date, end: Date) => {
        const normalizedStart = new Date(start);
        const normalizedEnd = new Date(end < start ? start : end);
        const diff = Math.max(1, differenceInCalendarDays(normalizedEnd, normalizedStart));

        setSelectedDate(normalizedStart);
        setSelectedEndDate(normalizedEnd);
        handleChange(normalizedStart, name);
        handleChange(String(diff), 'nights');
    };

    const handleSelectDate = (pickedDate: Date) => {
        if (activePoint === 'start') {
            const end = selectedEndDate && pickedDate <= selectedEndDate ? selectedEndDate : new Date(pickedDate);
            syncRange(pickedDate, end);
            setActivePoint('end');
            return;
        }

        const start = selectedDate || pickedDate;
        if (pickedDate < start) {
            syncRange(pickedDate, start);
        } else {
            syncRange(start, pickedDate);
        }
    };

    const modalTitle = activePoint === 'start' ? 'Выберите дату вылета' : 'Выберите дату возврата';
    const startLabel = selectedDate ? format(selectedDate, 'dd.MM.yy') : '--.--.--';
    const endLabel = selectedEndDate ? format(selectedEndDate, 'dd.MM.yy') : '--.--.--';

    return (
        <div className={`${styles.searchField} ${className || ''}`} ref={wrapperRef} onClick={handleToggle}>
            <Icon name={'calendar'} size={24} color="var(--textPrimary)" />
            <div className={styles.searchFieldInfo}>
                <p className={styles.searchFieldsLabel}>Даты и ночи</p>
                <p className={styles.searchFieldsValue}>{dateLabel}</p>
            </div>
            <Icon name={'downArrow'} size={24} color="var(--textPrimary)" />
            {isOpen && (
                <div className={styles.dateModal} onClick={(e) => e.stopPropagation()}>
                    <div className={styles.dateFromModalHead}>
                        <p>{modalTitle}</p>
                        <div onClick={() => setIsOpen(false)}>
                            <Icon name={'closeLine'} size={24} color="var(--textPrimary)" />
                        </div>
                    </div>
                    <div className={styles.dateRangeSwitch}>
                        <button
                            type="button"
                            className={`${styles.dateRangeSwitchBtn} ${activePoint === 'start' ? styles.dateRangeSwitchBtnActive : ''}`}
                            onClick={() => setActivePoint('start')}
                        >
                            Дата вылета: {startLabel}
                        </button>
                        <button
                            type="button"
                            className={`${styles.dateRangeSwitchBtn} ${activePoint === 'end' ? styles.dateRangeSwitchBtnActive : ''}`}
                            onClick={() => setActivePoint('end')}
                        >
                            Дата возврата: {endLabel}
                        </button>
                    </div>
                    <Calendar
                        setSelectedDate={handleSelectDate}
                        selectedDate={activePoint === 'start' ? selectedDate : selectedEndDate}
                        rangeStart={selectedDate}
                        rangeEnd={selectedEndDate}
                        monthsToShow={2}
                        hideToggle={true}
                    />
                    <div className={styles.dateFooter}>
                        <Button onClick={() => setIsOpen(false)} full={true} title={'Готово'} />
                    </div>
                </div>
            )}
        </div>
    );
};

export default SelectDate;
