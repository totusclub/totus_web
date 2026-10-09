import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import styles from './search.module.css';
import Icon from "@/components/icons/Icon";
import Calendar from "@/components/UI/calendar";
import { addDays, differenceInCalendarDays, format, parseISO, startOfDay } from "date-fns";
import { ru } from "date-fns/locale";
import Button from "@/components/UI/button";
import { formatNightsCount } from "@/utils/formatRussianPlural";

// ±2 departure date toggle (calendar ±2 days) disabled — fixed date only.

type SelectDateProps = {
    handleChange: any;
    value: any;
    className?: string;
    flexDates?: string | number;
    /** ISO end date from parent (e.g. `end_date_till`) — calendar return date */
    endValue?: string;
    /** Show only departure date in the closed field (hotel page). */
    departureOnlyLabel?: boolean;
};

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

/** Used when parent has no end yet, or same-day range → minimal +1 day */
const DEFAULT_RANGE_DAYS = 1;

/** Upper limit of the «Количество ночей» field (nights.tsx MAX) — return date cannot go further. */
export const MAX_RANGE_NIGHTS = 30;

function rangeFromProps(value: unknown, endValue?: string): { start: Date; end: Date } | null {
    const raw = String(value ?? '');
    const start = startOfDay(
        ISO_DATE.test(raw) ? parseISO(raw) : new Date(raw)
    );
    if (Number.isNaN(start.getTime())) return null;
    let end: Date;
    if (endValue && ISO_DATE.test(String(endValue))) {
        const parsed = startOfDay(parseISO(String(endValue)));
        if (!Number.isNaN(parsed.getTime())) {
            end = parsed < start ? addDays(start, DEFAULT_RANGE_DAYS) : parsed;
        } else {
            end = addDays(start, DEFAULT_RANGE_DAYS);
        }
    } else {
        end = addDays(start, DEFAULT_RANGE_DAYS);
    }
    return { start, end };
}

function nightsBetweenIso(startIso: string, endIso: string): number | null {
    if (!ISO_DATE.test(startIso) || !ISO_DATE.test(endIso)) return null;
    const a = startOfDay(parseISO(startIso));
    const b = startOfDay(parseISO(endIso));
    if (Number.isNaN(a.getTime()) || Number.isNaN(b.getTime())) return null;
    return Math.max(1, differenceInCalendarDays(b, a));
}

const SelectDate = ({
    handleChange,
    value,
    className,
    flexDates = 0,
    endValue,
    departureOnlyLabel = false,
}: SelectDateProps) => {
    const [selectedDate, setSelectedDate] = useState<Date | null>(() => {
        const r = rangeFromProps(value, endValue);
        return r?.start ?? null;
    });
    const [selectedEndDate, setSelectedEndDate] = useState<Date | null>(() => {
        const r = rangeFromProps(value, endValue);
        return r?.end ?? null;
    });
    const [isOpen, setIsOpen] = useState<boolean>(false);
    /** false → next tap chooses departure only (local); true → next tap chooses return and commits range */
    const [nextPickIsEnd, setNextPickIsEnd] = useState(false);
    /** Return date under the pointer while choosing it — live nights preview. */
    const [previewEndDate, setPreviewEndDate] = useState<Date | null>(null);
    const wrapperRef = useRef<HTMLDivElement>(null);
    const modalRef = useRef<HTMLDivElement>(null);
    const handleChangeRef = useRef(handleChange);
    handleChangeRef.current = handleChange;
    const hadOpenCalendarRef = useRef(false);

    /** After closing the picker: align nights with committed start/end (dates unchanged). */
    useEffect(() => {
        if (isOpen) {
            hadOpenCalendarRef.current = true;
            return;
        }
        if (!hadOpenCalendarRef.current) return;
        hadOpenCalendarRef.current = false;
        const startIso = String(value ?? '');
        const endIso = String(endValue ?? '');
        const n = nightsBetweenIso(startIso, endIso);
        if (n == null) return;
        handleChangeRef.current(String(n), 'sync_nights_from_dates');
    }, [isOpen, value, endValue]);

    useEffect(() => {
        const r = rangeFromProps(value, endValue);
        if (!r) return;
        setSelectedDate(r.start);
        setSelectedEndDate(r.end);
        setNextPickIsEnd(false);
    }, [value, endValue]);

    /** Closed modal while waiting for return date — drop local draft, restore parent range */
    useEffect(() => {
        if (isOpen || !nextPickIsEnd) return;
        const r = rangeFromProps(value, endValue);
        if (!r) return;
        setSelectedDate(r.start);
        setSelectedEndDate(r.end);
        setNextPickIsEnd(false);
    }, [isOpen, nextPickIsEnd, value, endValue]);

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

    /** Close when focus leaves the modal (keyboard / screen readers). */
    useEffect(() => {
        if (!isOpen) return;
        const onDocFocusOut = (e: FocusEvent) => {
            const modal = modalRef.current;
            if (!modal) return;
            const tgt = e.target as Node | null;
            if (!modal.contains(tgt)) return;
            const rt = e.relatedTarget as Node | null;
            if (rt && modal.contains(rt)) return;
            setIsOpen(false);
        };
        document.addEventListener('focusout', onDocFocusOut, true);
        return () => document.removeEventListener('focusout', onDocFocusOut, true);
    }, [isOpen]);

    const handleToggle = () => {
        setIsOpen((prev) => {
            const opening = !prev;
            if (opening) {
                setNextPickIsEnd(false);
            }
            return !prev;
        });
    };

    const closeModal = useCallback(() => {
        setIsOpen(false);
    }, []);

    const dateLabel = useMemo(() => {
        if (!selectedDate) return '--.--.--';
        const start = format(selectedDate, 'd MMM', { locale: ru }).toLowerCase();
        if (departureOnlyLabel || !selectedEndDate) {
            return start;
        }
        const end = format(selectedEndDate, 'd MMM', { locale: ru }).toLowerCase();
        return `${start} – ${end}`;
    }, [selectedDate, selectedEndDate, departureOnlyLabel]);

    const syncRangeToParent = (start: Date, end: Date) => {
        const normalizedStart = startOfDay(start);
        let normalizedEnd = startOfDay(end < normalizedStart ? normalizedStart : end);
        if (normalizedEnd.getTime() === normalizedStart.getTime()) {
            normalizedEnd = addDays(normalizedStart, DEFAULT_RANGE_DAYS);
        }

        setSelectedDate(normalizedStart);
        setSelectedEndDate(normalizedEnd);
        handleChange(
            {
                start: format(normalizedStart, 'yyyy-MM-dd'),
                end: format(normalizedEnd, 'yyyy-MM-dd'),
            },
            'date_range'
        );
        // Nights follow the chosen range right away (not only after the calendar closes).
        const nights = Math.max(1, differenceInCalendarDays(normalizedEnd, normalizedStart));
        handleChange(String(nights), 'sync_nights_from_dates');
    };

    const handleSelectDate = (pickedDate: Date) => {
        const day = startOfDay(pickedDate);
        if (!nextPickIsEnd) {
            setSelectedDate(day);
            setSelectedEndDate(null);
            setNextPickIsEnd(true);
            return;
        }

        const start = selectedDate ? startOfDay(selectedDate) : day;
        // A day on/before departure while choosing the return date starts a new range.
        if (day <= start) {
            setSelectedDate(day);
            setSelectedEndDate(null);
            setPreviewEndDate(null);
            return;
        }
        syncRangeToParent(start, day);
        setPreviewEndDate(null);
        setNextPickIsEnd(false);
    };

    /** Departure / return switch above the calendar. */
    const pickDeparture = () => {
        setNextPickIsEnd(false);
        setPreviewEndDate(null);
    };
    const pickReturn = () => {
        if (!selectedDate) return;
        setSelectedEndDate(null);
        setNextPickIsEnd(true);
    };

    const modalTitle = nextPickIsEnd ? 'Выберите дату возврата' : 'Выберите дату вылета';
    const chipDate = (d: Date) => format(d, 'EEEEEE, d MMM', { locale: ru }).replace('.', '');
    const startLabel = selectedDate ? chipDate(selectedDate) : '—';
    const endLabel = selectedEndDate ? chipDate(selectedEndDate) : '—';
    const nightsEnd = selectedEndDate ?? previewEndDate;
    const shownNights =
        selectedDate && nightsEnd && nightsEnd > selectedDate
            ? differenceInCalendarDays(startOfDay(nightsEnd), startOfDay(selectedDate))
            : null;
    const maxReturnDate =
        nextPickIsEnd && selectedDate ? addDays(startOfDay(selectedDate), MAX_RANGE_NIGHTS) : null;

    return (
        <div className={`${styles.searchField} ${className || ''}`} ref={wrapperRef} onClick={handleToggle}>
            <Icon name={'calendar'} size={24} color="var(--textPrimary)" />
            <div className={styles.searchFieldInfo}>
                <p className={styles.searchFieldsLabel}>Даты и ночи</p>
                <p className={styles.searchFieldsValue}>{dateLabel}</p>
            </div>
            <Icon name={'downArrow'} size={24} color="var(--textPrimary)" />
            {isOpen && (
                <div
                    ref={modalRef}
                    className={styles.dateModal}
                    onClick={(e) => e.stopPropagation()}
                >
                    <div className={styles.dateFromModalHead}>
                        <p>{modalTitle}</p>
                        <div onClick={closeModal}>
                            <Icon name={'closeLine'} size={24} color="var(--textPrimary)" />
                        </div>
                    </div>
                    <div className={styles.dateRangeChips}>
                        <button
                            type="button"
                            className={`${styles.dateRangeChip} ${!nextPickIsEnd ? styles.dateRangeChipActive : ''}`}
                            aria-pressed={!nextPickIsEnd}
                            onClick={pickDeparture}
                        >
                            <span>Вылет</span>
                            <b>{startLabel}</b>
                        </button>
                        <button
                            type="button"
                            className={`${styles.dateRangeChip} ${nextPickIsEnd ? styles.dateRangeChipActive : ''}`}
                            aria-pressed={nextPickIsEnd}
                            onClick={pickReturn}
                        >
                            <span>{nextPickIsEnd ? 'Возврат — выберите' : 'Возврат'}</span>
                            <b>{endLabel}</b>
                        </button>
                        {/* Always in the layout (hidden while unknown) so the calendar does not jump on hover. */}
                        <span
                            className={styles.dateRangeNights}
                            aria-live="polite"
                            style={shownNights == null ? { visibility: 'hidden' } : undefined}
                        >
                            {shownNights != null ? formatNightsCount(shownNights) : formatNightsCount(MAX_RANGE_NIGHTS)}
                        </span>
                    </div>
                    <Calendar
                        setSelectedDate={handleSelectDate}
                        selectedDate={
                            nextPickIsEnd && selectedEndDate ? selectedEndDate : selectedDate
                        }
                        rangeStart={selectedDate}
                        rangeEnd={selectedEndDate}
                        rangeSelectionPhase={nextPickIsEnd ? 'end' : 'start'}
                        maxSelectableDate={maxReturnDate}
                        onPreviewDateChange={setPreviewEndDate}
                        monthsToShow={2}
                        allowPastDates={false}
                        hideToggle={true}
                        // ±2 dates UI disabled
                        // plusMinusEnabled={Number(flexDates) === 2}
                        // onPlusMinusChange={(enabled) => handleChange(enabled ? '2' : '0', 'flex_dates')}
                        // plusMinusEnabled={false}
                    />
                    <div className={styles.dateFooter}>
                        <Button
                            onClick={closeModal}
                            full={true}
                            title={shownNights != null && !nextPickIsEnd ? `Готово · ${formatNightsCount(shownNights)}` : 'Готово'}
                        />
                    </div>
                </div>
            )}
        </div>
    );
};

export default SelectDate;
