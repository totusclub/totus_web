import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
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
    isAfter,
    min as minDate,
    max as maxDate,
} from 'date-fns';
import { ru } from 'date-fns/locale';
import Icon from "@/components/icons/Icon";
import styles from './calendar.module.css';
import SwitchToggle from "@/components/UI/switch";

export type RangeSelectionPhase = 'start' | 'end';

interface CalendarProps {
    selectedDate: Date | null;
    setSelectedDate: (date: Date) => void;
    allowPastDates?: boolean;
    hideToggle?: boolean;
    rangeStart?: Date | null;
    rangeEnd?: Date | null;
    monthsToShow?: number;
    plusMinusEnabled?: boolean;
    onPlusMinusChange?: (enabled: boolean) => void;
    /** When set with rangeStart/rangeEnd, enables hover preview for the return-date step */
    rangeSelectionPhase?: RangeSelectionPhase | null;
    /** Days after this date are disabled (e.g. the max nights limit while picking the return date). */
    maxSelectableDate?: Date | null;
    /** Hover/focus preview of the return date (null when the pointer leaves the grid). */
    onPreviewDateChange?: (date: Date | null) => void;
}

const Calendar = ({
    selectedDate,
    setSelectedDate,
    allowPastDates = false,
    hideToggle = false,
    rangeStart = null,
    rangeEnd = null,
    monthsToShow = 1,
    plusMinusEnabled,
    onPlusMinusChange,
    rangeSelectionPhase = null,
    maxSelectableDate = null,
    onPreviewDateChange,
}: CalendarProps) => {
    const initialMonthSeed = rangeStart ?? selectedDate ?? new Date();
    const [currentMonth, setCurrentMonth] = useState(() => startOfMonth(initialMonthSeed));
    const [showPlusMinus, setShowPlusMinus] = useState(false);
    const [showYearPicker, setShowYearPicker] = useState(false);
    const [showMonthPicker, setShowMonthPicker] = useState(false);
    const [hoverDate, setHoverDate] = useState<Date | null>(null);
    const calendarRef = useRef<HTMLDivElement>(null);

    const today = startOfDay(new Date());

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

    useEffect(() => {
        if (typeof plusMinusEnabled === 'boolean') {
            setShowPlusMinus(plusMinusEnabled);
        }
    }, [plusMinusEnabled]);

    useEffect(() => {
        if (rangeSelectionPhase !== 'end') {
            setHoverDate(null);
        }
    }, [rangeSelectionPhase]);

    const onPreviewDateChangeRef = useRef(onPreviewDateChange);
    onPreviewDateChangeRef.current = onPreviewDateChange;
    useEffect(() => {
        onPreviewDateChangeRef.current?.(hoverDate);
    }, [hoverDate]);

    /** Range mode: the departure/return pair draws the selection, not `selectedDate`. */
    const isRangeMode = Boolean(rangeStart);
    const maxSelectableDay = maxSelectableDate ? startOfDay(maxSelectableDate) : null;
    const isPreviewing =
        rangeSelectionPhase === 'end' &&
        Boolean(hoverDate && rangeStart && !isBefore(startOfDay(hoverDate), startOfDay(rangeStart)));

    const isPlusMinusTwo = useCallback(
        (date: Date) => {
            if (!selectedDate || isSameDay(date, selectedDate)) return false;
            const diff = Math.abs(differenceInCalendarDays(startOfDay(date), startOfDay(selectedDate)));
            return diff <= 2;
        },
        [selectedDate]
    );

    const effectiveRangeBounds = useMemo(() => {
        if (!rangeStart) return null;
        const rs = startOfDay(rangeStart);

        if (!rangeEnd) {
            // Return-date preview only forward: a day before departure starts a new range instead.
            if (rangeSelectionPhase === 'end' && hoverDate && !isBefore(startOfDay(hoverDate), rs)) {
                return { lo: rs, hi: startOfDay(hoverDate) };
            }
            return { lo: rs, hi: rs };
        }

        const re = startOfDay(rangeEnd);
        const committedLo = minDate([rs, re]);
        const committedHi = maxDate([rs, re]);

        if (rangeSelectionPhase !== 'end' || !hoverDate) {
            return { lo: committedLo, hi: committedHi };
        }

        const h = startOfDay(hoverDate);
        return { lo: minDate([rs, h]), hi: maxDate([rs, h]) };
    }, [rangeStart, rangeEnd, rangeSelectionPhase, hoverDate]);

    const getDayCellProps = useCallback(
        (currentDay: Date, month: Date) => {
            const day = startOfDay(currentDay);
            const isCurrentMonth = isSameMonth(currentDay, month);
            const isDisabled =
                (!allowPastDates && isBefore(day, today)) ||
                Boolean(maxSelectableDay && isAfter(day, maxSelectableDay));

            const matchesSelected = Boolean(selectedDate && isSameDay(day, startOfDay(selectedDate)));
            /** While choosing return date, keep departure visible as selected even if `selectedDate` is the end. */
            const isDepartureAnchorInEndPhase =
                rangeSelectionPhase === 'end' &&
                rangeStart &&
                selectedDate &&
                rangeEnd &&
                isSameDay(day, startOfDay(rangeStart)) &&
                !isSameDay(startOfDay(rangeStart), startOfDay(selectedDate));
            const isSelected = !isRangeMode && (matchesSelected || isDepartureAnchorInEndPhase);

            let isRangeStart = false;
            let isRangeEnd = false;
            let isInSelectedRange = false;

            if (effectiveRangeBounds) {
                const { lo, hi } = effectiveRangeBounds;
                isRangeStart = isSameDay(day, lo);
                isRangeEnd = isSameDay(day, hi);
                isInSelectedRange =
                    !isRangeStart &&
                    !isRangeEnd &&
                    (isAfter(day, lo) && isBefore(day, hi));
            }

            const isInPlusBand = showPlusMinus && isPlusMinusTwo(day);

            return {
                day,
                isCurrentMonth,
                isDisabled,
                isSelected,
                isRangeStart,
                isRangeEnd,
                isInSelectedRange,
                isInPlusBand,
            };
        },
        [
            allowPastDates,
            today,
            selectedDate,
            effectiveRangeBounds,
            showPlusMinus,
            isPlusMinusTwo,
            rangeSelectionPhase,
            rangeStart,
            isRangeMode,
            maxSelectableDay,
        ]
    );

    const handleDayPointerEnter = (day: Date, disabled: boolean) => {
        if (disabled) {
            if (rangeSelectionPhase === 'end') setHoverDate(null);
            return;
        }
        if (rangeSelectionPhase === 'end' && rangeStart) {
            setHoverDate(startOfDay(day));
        }
    };

    const handleGridPointerLeave = () => {
        if (rangeSelectionPhase === 'end') {
            setHoverDate(null);
        }
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
            'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь',
        ];

        return (
            <div className={styles.headerCalendar}>
                <button
                    type="button"
                    className={styles.navButton}
                    aria-label="Предыдущий месяц"
                    onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
                >
                    <Icon name={'leftArrow'} size={24} color="var(--textPrimary)" />
                </button>
                <div className={styles.headerDatePicker}>
                    <button
                        type="button"
                        className={styles.datePickerButton}
                        aria-expanded={showMonthPicker}
                        aria-haspopup="listbox"
                        aria-label="Выбор месяца"
                        onClick={(e) => {
                            e.stopPropagation();
                            setShowMonthPicker(!showMonthPicker);
                            setShowYearPicker(false);
                        }}
                    >
                        {months[currentMonthIndex]}
                    </button>
                    <button
                        type="button"
                        className={styles.datePickerButton}
                        aria-expanded={showYearPicker}
                        aria-haspopup="listbox"
                        aria-label="Выбор года"
                        onClick={(e) => {
                            e.stopPropagation();
                            setShowYearPicker(!showYearPicker);
                            setShowMonthPicker(false);
                        }}
                    >
                        {currentYear}
                    </button>
                    {showMonthPicker && (
                        <div className={styles.pickerDropdown} role="listbox" onClick={(e) => e.stopPropagation()}>
                            {months.map((month, index) => (
                                <div
                                    key={index}
                                    role="option"
                                    aria-selected={index === currentMonthIndex}
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
                                        role="option"
                                        aria-selected={year === currentYear}
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
                <button
                    type="button"
                    className={styles.navButton}
                    aria-label="Следующий месяц"
                    onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
                >
                    <Icon name={'rightArrow'} size={24} color="var(--textPrimary)" />
                </button>
            </div>
        );
    };

    const renderDays = () => {
        const days = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];
        return (
            <div className={styles.daysRow}>
                {days.map((d) => (
                    <div key={d} className={styles.dayName}>
                        {d}
                    </div>
                ))}
            </div>
        );
    };

    const renderCells = (month: Date) => {
        const monthStart = startOfMonth(month);
        const monthEnd = endOfMonth(monthStart);
        const gridStart = startOfWeek(monthStart, { locale: ru, weekStartsOn: 1 });
        const gridEnd = endOfWeek(monthEnd, { locale: ru, weekStartsOn: 1 });

        const rows: React.ReactNode[] = [];
        let cursor = gridStart;
        let rowKey = 0;

        while (cursor <= gridEnd) {
            const days: React.ReactNode[] = [];
            for (let i = 0; i < 7; i++) {
                const currentDay = cursor;
                const key = format(currentDay, 'yyyy-MM-dd');
                const props = getDayCellProps(currentDay, month);

                // Days of the neighbouring month are not drawn: with two months side by side
                // 1 November must not appear in the October grid (and get highlighted twice).
                if (!props.isCurrentMonth) {
                    days.push(<span key={key} className={`${styles.cell} ${styles.cellEmpty}`} aria-hidden="true" />);
                    cursor = addDays(cursor, 1);
                    continue;
                }

                // Edges of the visual row: the range band gets rounded corners there.
                const isRowStart = i === 0 || currentDay.getDate() === 1;
                const isRowEnd = i === 6 || isSameDay(currentDay, endOfMonth(month));

                const isSingleDayRange = props.isRangeStart && props.isRangeEnd;
                const classNames = [
                    styles.cell,
                    styles.cellButton,
                    props.isDisabled ? styles.cellDisabled : styles.cellInteractive,
                    !props.isCurrentMonth ? styles.cellOutsideMonth : '',
                    isSingleDayRange ? styles.cellRangeSingle : '',
                    !isSingleDayRange && props.isRangeStart ? styles.cellRangeStart : '',
                    !isSingleDayRange && props.isRangeEnd ? styles.cellRangeEnd : '',
                    props.isInSelectedRange ? styles.cellInRange : '',
                    isRowStart ? styles.cellRowStart : '',
                    isRowEnd ? styles.cellRowEnd : '',
                    isPreviewing && (props.isInSelectedRange || props.isRangeStart || props.isRangeEnd)
                        ? styles.cellPreview
                        : '',
                    isPreviewing && props.isRangeEnd && !isSingleDayRange ? styles.cellPreviewEnd : '',
                    props.isSelected ? styles.cellSelected : '',
                    props.isInPlusBand &&
                    !props.isRangeStart &&
                    !props.isRangeEnd &&
                    !props.isInSelectedRange
                        ? styles.cellPlusBand
                        : '',
                ]
                    .filter(Boolean)
                    .join(' ');

                const label = format(currentDay, 'd MMMM yyyy', { locale: ru });

                days.push(
                    <button
                        key={key}
                        type="button"
                        className={classNames}
                        disabled={props.isDisabled}
                        aria-label={label}
                        aria-pressed={props.isRangeStart || props.isRangeEnd || props.isSelected || undefined}
                        tabIndex={props.isDisabled ? -1 : 0}
                        onClick={() => {
                            if (!props.isDisabled) {
                                setSelectedDate(new Date(currentDay));
                            }
                        }}
                        onPointerEnter={() => handleDayPointerEnter(currentDay, props.isDisabled)}
                        onFocus={() => handleDayPointerEnter(currentDay, props.isDisabled)}
                    >
                        <span className={styles.cellInner}>{format(currentDay, 'd')}</span>
                    </button>
                );

                cursor = addDays(cursor, 1);
            }

            rows.push(
                <div key={`row-${rowKey++}`} className={styles.weekRow}>
                    {days}
                </div>
            );
        }

        return <div>{rows}</div>;
    };

    return (
        <div className={styles.calendarWrapper} ref={calendarRef}>
            {renderHeader()}
            <div
                className={`${styles.monthsGrid} ${monthsToShow > 1 ? styles.monthsGridTwo : ''}`}
                role="region"
                aria-label="Календарь"
                onPointerLeave={handleGridPointerLeave}
            >
                {Array.from({ length: monthsToShow }).map((_, i) => {
                    const monthDate = addMonths(currentMonth, i);
                    return (
                        <div key={monthDate.toISOString()} className={styles.monthColumn}>
                            {monthsToShow > 1 && (
                                <p className={styles.monthLabel}>
                                    {format(monthDate, 'LLLL yyyy', { locale: ru })}
                                </p>
                            )}
                            {renderDays()}
                            {renderCells(monthDate)}
                        </div>
                    );
                })}
            </div>
            {/* ±2 days toggle disabled — fixed departure date only
            {!hideToggle && (
                <div className={styles.toggleRow}>
                    <p>±2 дня</p>
                    <SwitchToggle
                        isOn={showPlusMinus}
                        setIsOn={(enabled: boolean) => {
                            setShowPlusMinus(enabled);
                            onPlusMinusChange?.(enabled);
                        }}
                    />
                </div>
            )}
            */}
        </div>
    );
};

export default Calendar;
