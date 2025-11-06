import React, { useState, useEffect } from 'react';
import styles from './phoneInputField.module.css';

interface PhoneInputFieldProps {
    value: string | number;
    onChange: (value: string) => void;
    placeholder?: string;
    required?: boolean;
    error?: string;
}

const PhoneInputField: React.FC<PhoneInputFieldProps> = ({
    value,
    onChange,
    placeholder = '+7 (___) ___-__-__',
    required,
    error
}) => {
    const [phoneValue, setPhoneValue] = useState<string>('');

    useEffect(() => {
        if (value) {
            const cleaned = value.toString().replace(/\D/g, '');
            setPhoneValue(cleaned);
        } else {
            setPhoneValue('');
        }
    }, [value]);

    const formatPhone = (val: string): string => {
        // Remove all non-digits
        const cleaned = val.replace(/\D/g, '');

        // If starts with 8, replace with 7
        let formatted = cleaned.startsWith('8') ? '7' + cleaned.slice(1) : cleaned;

        // Limit to 11 digits (7 + 10 digits)
        formatted = formatted.slice(0, 11);

        // Format: +7 (XXX) XXX-XX-XX
        if (formatted.length === 0) {
            return '';
        } else if (formatted.length <= 1) {
            return `+${formatted}`;
        } else if (formatted.length <= 4) {
            return `+7 (${formatted.slice(1)}`;
        } else if (formatted.length <= 7) {
            return `+7 (${formatted.slice(1, 4)}) ${formatted.slice(4)}`;
        } else if (formatted.length <= 9) {
            return `+7 (${formatted.slice(1, 4)}) ${formatted.slice(4, 7)}-${formatted.slice(7)}`;
        } else {
            return `+7 (${formatted.slice(1, 4)}) ${formatted.slice(4, 7)}-${formatted.slice(7, 9)}-${formatted.slice(9, 11)}`;
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const inputValue = e.target.value;
        const cleaned = inputValue.replace(/\D/g, '');

        // If starts with 8, replace with 7
        let processed = cleaned.startsWith('8') ? '7' + cleaned.slice(1) : cleaned;
        processed = processed.slice(0, 11); // Max 11 digits

        setPhoneValue(processed);
        onChange(processed); // Return cleaned number for storage
    };

    const displayValue = formatPhone(phoneValue);

    return (
        <div className={styles.phoneInputWrapper}>
            <input
                type="tel"
                value={displayValue}
                onChange={handleChange}
                placeholder={placeholder}
                required={required}
                className={`${styles.phoneInput} ${error ? styles.phoneInputError : ''}`}
                maxLength={18} // +7 (XXX) XXX-XX-XX = 18 chars
                aria-invalid={error ? 'true' : 'false'}
            />
            {error && <span className={styles.errorMessage}>{error}</span>}
        </div>
    );
};

export default PhoneInputField;

