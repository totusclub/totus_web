import React, { useState, useRef, useEffect } from 'react';
import styles from './select.module.css';
import Icon from "@/components/icons/Icon";

interface OptionType {
    name: string;
    value: string;
    icon: string
}

interface SelectProps {
    options: OptionType[];
    value?: string;
    onChange: (option: string) => void;
    placeholder?: string;
    label?: string;
    isFull?: boolean;
    type?: string;
}

const Select: React.FC<SelectProps> = ({
    options,
    value,
    onChange,
    placeholder = 'Select an option',
    label,
    isFull = false
}) => {
    const [open, setOpen] = useState(false);
    const [openUp, setOpenUp] = useState(false);
    const selectRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (selectRef.current && !selectRef.current.contains(event.target as Node)) {
                setOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    useEffect(() => {
        if (open && selectRef.current) {
            const rect = selectRef.current.getBoundingClientRect();
            const spaceBelow = window.innerHeight - rect.bottom;
            const spaceAbove = rect.top;
            const estimatedHeight = Math.min(options.length * 40, 200);
            setOpenUp(spaceBelow < estimatedHeight && spaceAbove > estimatedHeight);
        }
    }, [open, options.length]);

    const handleSelect = (option: OptionType) => {
        onChange(option.name);
        setOpen(false);
    };
    return (
        <div
            ref={selectRef}
            className={styles.customSelect}
            style={{ flex: isFull ? 1 : 'none' }}
        >
            <div
                className={styles.selectButton}
                onClick={() => setOpen((prev) => !prev)}
                role="combobox"
                aria-expanded={open}
                aria-haspopup="listbox"
            >
                <div className={styles.selectButtonInfo}>
                    {label && <p className={styles.selectLabel}>{label}</p>}
                    <p className={`${styles.selectValue} ${!value ? styles.placeholder : ''}`}>
                        {value || placeholder}
                    </p>
                </div>
                <div className={styles.arrow}>
                    <Icon name="downArrow" size={24} color="var(--textPrimary)" />
                </div>
                <div className={styles.arrowMob}>
                    <Icon name="downArrow" size={24} color="var(--core_Orange)" />
                </div>
            </div>

            {open && (
                <ul
                    className={`${styles.optionsList} ${openUp ? styles.openUp : styles.openDown
                        }`}
                >
                    {options.map((option, index) => (
                        <li
                            key={index}
                            onClick={() => handleSelect(option)}
                            className={`${styles.optionItem} ${value === option.name ? styles.active : ''}`}
                        >
                            <div>
                                {option.icon && option.icon.trim() !== '' && (
                                    <Icon name={option.icon} size={16} color="var(--textPrimary)" />
                                )}
                                {option.name}
                            </div>
                            {value === option.name && (
                                <Icon name={'optionCheck'} size={16} color="var(--textPrimary)" />
                            )}
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
};

export default Select;
