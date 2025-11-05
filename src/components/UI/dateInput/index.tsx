import React, { useEffect, useRef, useState } from 'react';
import styles from './dateInput.module.css';
import Icon from "@/components/icons/Icon";
import Calendar from "@/components/UI/calendar";
import { format, parse } from "date-fns";
import Button from "@/components/UI/button";

interface DateInputProps {
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    required?: boolean;
    allowPastDates?: boolean; // If true, allows selecting past dates (for date of birth)
    label?: string; // Label text to display above the input
    error?: string;
}

const DateInput: React.FC<DateInputProps> = ({
    value,
    onChange,
    placeholder = 'MM.DD.YYYY',
    required,
    allowPastDates = false,
    label,
    error
}) => {
    const [selectedDate, setSelectedDate] = useState<Date | null>(null);
    const [isOpen, setIsOpen] = useState<boolean>(false);
    const [inputValue, setInputValue] = useState<string>('');
    const wrapperRef = useRef<HTMLDivElement>(null);

    // Parse value string (MM.DD.YYYY) to Date
    useEffect(() => {
        if (value && value.trim() !== '') {
            try {
                // Try to parse MM.DD.YYYY format (note: dd in date-fns means day, DD means day of year)
                const parsed = parse(value, 'MM.dd.yyyy', new Date());
                if (!isNaN(parsed.getTime())) {
                    setSelectedDate(parsed);
                    setInputValue(value);
                } else {
                    setInputValue(value);
                }
            } catch {
                setInputValue(value);
            }
        } else {
            setSelectedDate(null);
            setInputValue('');
        }
    }, [value]);

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

    const handleSelectDate = (date: Date) => {
        setSelectedDate(date);
        const formattedDate = format(date, 'MM.dd.yyyy');
        setInputValue(formattedDate);
        onChange(formattedDate);
    };

    const validateDate = (month: string, day: string, year: string): boolean => {
        // Validate month (01-12)
        const monthNum = parseInt(month, 10);
        if (isNaN(monthNum) || monthNum < 1 || monthNum > 12) {
            return false;
        }

        // Validate day (01-31)
        const dayNum = parseInt(day, 10);
        if (isNaN(dayNum) || dayNum < 1 || dayNum > 31) {
            return false;
        }

        // Validate day for specific months
        const daysInMonth = [31, 29, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
        if (dayNum > daysInMonth[monthNum - 1]) {
            return false;
        }

        // If year is provided, validate full date
        if (year && year.length === 4) {
            const yearNum = parseInt(year, 10);
            if (isNaN(yearNum) || yearNum < 1900 || yearNum > 2100) {
                return false;
            }

            // Check if date is valid (e.g., Feb 30 doesn't exist)
            try {
                const testDate = parse(`${month}.${day}.${year}`, 'MM.dd.yyyy', new Date());
                if (isNaN(testDate.getTime())) {
                    return false;
                }
                // Check if parsed date matches input (handles Feb 29 in non-leap years)
                const formatted = format(testDate, 'MM.dd.yyyy');
                if (formatted !== `${month}.${day}.${year}`) {
                    return false;
                }
            } catch {
                return false;
            }
        }

        return true;
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        let val = e.target.value;
        // Only allow digits and dots
        val = val.replace(/[^\d.]/g, '');

        // Remove all dots first to rebuild the format
        const digitsOnly = val.replace(/\./g, '');

        let formatted = '';
        let shouldUpdate = true;

        // Add month (first 2 digits)
        if (digitsOnly.length > 0) {
            const month = digitsOnly.slice(0, 2);

            // Validate month after 2 digits
            if (digitsOnly.length >= 2) {
                const monthNum = parseInt(month, 10);
                // Prevent invalid months (00, 13-99)
                if (monthNum > 12) {
                    // Block invalid month - keep previous value
                    shouldUpdate = false;
                } else {
                    formatted = month;
                }
            } else {
                formatted = month;
            }

            // Auto-add dot after month if there are more digits
            if (digitsOnly.length > 2 && shouldUpdate) {
                const day = digitsOnly.slice(2, 4);

                // Validate day after 4 digits
                if (digitsOnly.length >= 4) {
                    const dayNum = parseInt(day, 10);
                    // Basic day validation (01-31)
                    if (dayNum > 31) {
                        // Block invalid day - keep previous value
                        shouldUpdate = false;
                    } else {
                        // Validate day for specific month
                        const monthNum = parseInt(month, 10);
                        if (monthNum >= 1 && monthNum <= 12) {
                            const daysInMonth = [31, 29, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
                            if (dayNum > daysInMonth[monthNum - 1]) {
                                shouldUpdate = false;
                            } else {
                                formatted += '.' + day;
                            }
                        } else {
                            formatted += '.' + day;
                        }
                    }
                } else {
                    formatted += '.' + day;
                }

                // Auto-add dot after day if there are more digits
                if (digitsOnly.length > 4 && shouldUpdate) {
                    const year = digitsOnly.slice(4, 8);
                    formatted += '.' + year;
                }
            }
        }

        if (shouldUpdate) {
            setInputValue(formatted);

            // Try to parse and update if valid (at least 8 digits for a complete date)
            if (formatted.length === 10) {
                const parts = formatted.split('.');
                if (parts.length === 3 && validateDate(parts[0], parts[1], parts[2])) {
                    try {
                        const parsed = parse(formatted, 'MM.dd.yyyy', new Date());
                        if (!isNaN(parsed.getTime())) {
                            setSelectedDate(parsed);
                            onChange(formatted);
                        } else {
                            onChange(formatted);
                        }
                    } catch {
                        onChange(formatted);
                    }
                } else {
                    onChange(formatted);
                }
            } else {
                // Update value as user types
                onChange(formatted);
            }
        }
    };

    const handleInputBlur = () => {
        // Validate and format on blur
        if (inputValue && inputValue.length === 10) {
            const parts = inputValue.split('.');
            if (parts.length === 3 && validateDate(parts[0], parts[1], parts[2])) {
                try {
                    const parsed = parse(inputValue, 'MM.dd.yyyy', new Date());
                    if (!isNaN(parsed.getTime())) {
                        const formatted = format(parsed, 'MM.dd.yyyy');
                        setInputValue(formatted);
                        setSelectedDate(parsed);
                        onChange(formatted);
                    }
                } catch {
                    // Invalid date - clear or keep as is
                }
            } else {
                // Invalid date format - could clear or show error
                // For now, keep the value so user can fix it
            }
        } else if (inputValue && inputValue.length > 0 && inputValue.length < 10) {
            // Incomplete date - clear it on blur if not complete
            setInputValue('');
            setSelectedDate(null);
            onChange('');
        }
    };

    return (
        <div className={styles.dateInputWrapper} ref={wrapperRef}>
            {label && <label className={styles.label}>{label}</label>}
            <div className={`${styles.dateInput} ${error ? styles.dateInputError : ''}`}>
                <div onClick={handleToggle} style={{ cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                    <Icon name={'calendar'} size={20} color="#666" />
                </div>
                <input
                    type="text"
                    value={inputValue}
                    onChange={handleInputChange}
                    onBlur={handleInputBlur}
                    onFocus={(e) => {
                        e.stopPropagation();
                        e.currentTarget.focus();
                    }}
                    onClick={(e) => {
                        e.stopPropagation();
                        e.currentTarget.focus();
                    }}
                    onKeyDown={(e) => {
                        e.stopPropagation();
                    }}
                    placeholder={placeholder}
                    required={required}
                    maxLength={10}
                    className={styles.input}
                    autoComplete="off"
                />
                <div onClick={handleToggle} style={{ cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                    <Icon name={'downArrow'} size={20} color="#666" />
                </div>
            </div>
            {isOpen && (
                <div className={styles.dateModal} onClick={(e) => e.stopPropagation()}>
                    <div className={styles.dateModalHead}>
                        <p>{label || 'Выберите дату'}</p>
                        <div onClick={() => setIsOpen(false)}>
                            <Icon name={'closeLine'} size={24} color="#000" />
                        </div>
                    </div>
                    <Calendar
                        setSelectedDate={handleSelectDate}
                        selectedDate={selectedDate}
                        allowPastDates={allowPastDates}
                        hideToggle={true}
                    />
                    <div className={styles.dateFooter}>
                        <Button onClick={() => setIsOpen(false)} full={true} title={'Готово'} />
                    </div>
                </div>
            )}
            {error && <span className={styles.errorMessage}>{error}</span>}
        </div>
    );
};

export default DateInput;

