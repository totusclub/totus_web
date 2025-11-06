import styles from './input.module.css';
import React from 'react';

interface InputProps {
    value: string | number;
    onChange: (value: string | number) => void;
    placeholder?: string;
    type?: 'text' | 'number' | 'email' | 'tel' | 'password'; // more specific types
    label?: string;
    min?: number;
    max?: number;
    maxLength?: number;
    required?: boolean;
    error?: string;
}

const Input: React.FC<InputProps> = ({
    value,
    onChange,
    placeholder,
    type = 'text',
    label,
    min,
    max,
    maxLength,
    required,
    error,
}) => {
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        let val: string | number = e.target.value;

        // Apply maxLength if specified
        if (maxLength !== undefined && val.toString().length > maxLength) {
            val = val.toString().slice(0, maxLength);
        }

        if (type === 'number') {
            const numericVal = parseFloat(val.toString());

            if (!isNaN(numericVal)) {
                if (max !== undefined && numericVal > max) {
                    val = max;
                } else if (min !== undefined && numericVal < min) {
                    val = min;
                } else {
                    val = numericVal;
                }
            } else {
                val = '';
            }
        }

        onChange(val);
    };

    return (
        <div className={styles.inputWrapper}>
            <div className={`${styles.input} ${error ? styles.inputError : ''}`}>
                {label && <label>{label}</label>}
                <input
                    type={type}
                    value={value}
                    placeholder={placeholder}
                    onChange={handleChange}
                    min={type === 'number' && min !== undefined ? min : undefined}
                    max={type === 'number' && max !== undefined ? max : undefined}
                    maxLength={maxLength}
                    required={required}
                    aria-invalid={error ? 'true' : 'false'}
                />
            </div>
            {error && <span className={styles.errorMessage}>{error}</span>}
        </div>
    );
};

export default Input;
