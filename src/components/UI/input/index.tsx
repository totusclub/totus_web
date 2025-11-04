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
}

const Input: React.FC<InputProps> = ({
                                         value,
                                         onChange,
                                         placeholder,
                                         type = 'text',
                                         label,
                                         min,
                                         max,
                                     }) => {
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        let val: string | number = e.target.value;

        if (type === 'number') {
            const numericVal = parseFloat(val);

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
        <div className={styles.input}>
            {label && <label>{label}</label>}
            <input
                type={type}
                value={value}
                placeholder={placeholder}
                onChange={handleChange}
                min={type === 'number' && min !== undefined ? min : undefined}
                max={type === 'number' && max !== undefined ? max : undefined}
            />
        </div>
    );
};

export default Input;
