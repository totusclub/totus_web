import React, {useEffect, useRef, useState} from 'react';
import styles from './search.module.css';
import Icon from "@/components/icons/Icon";
import Calendar from "@/components/UI/calendar";
import {format} from "date-fns";
import Button from "@/components/UI/button";

const SelectDate = ({handleChange,value,name}) => {
    const [selectedDate, setSelectedDate] = useState<Date | null>(new Date(value));
    const [isOpen, setIsOpen] = useState<boolean>(false);
    const wrapperRef = useRef<HTMLDivElement>(null);

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
    };

    const handleSelectDate = (dates) => {
        setSelectedDate(dates)
        const formatDate = format(new Date(selectedDate as Date), 'dd.MM.yy')
        handleChange(dates,name)
    }
    return (
        <div className={styles.searchField} ref={wrapperRef} onClick={handleToggle}>
            <Icon name={'calendar'} size={24} color="#000"/>
            <div className={styles.searchFieldInfo}>
                <p className={styles.searchFieldsLabel}>Дата вылета</p>
                <p className={styles.searchFieldsValue}>{format(new Date(selectedDate as Date), 'dd.MM.yy')}</p>
            </div>
            <Icon name={'downArrow'} size={24} color="#000"/>
            {isOpen && (
                <div className={styles.dateModal} onClick={(e) => e.stopPropagation()}>
                    <div className={styles.dateFromModalHead}>
                        <p>Дата вылета</p>
                        <div onClick={() => setIsOpen(false)}>
                            <Icon name={'closeLine'} size={24} color="#000"/>
                        </div>
                    </div>
                    <Calendar setSelectedDate={handleSelectDate} selectedDate={selectedDate}/>
                    <div className={styles.dateFooter}>
                        <Button onClick={() => setIsOpen(false)} full={true} title={'Готово'}/>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SelectDate;
