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
    isFull = false,
    type
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
        onChange(option);
        setOpen(false);
    };
    console.log('value', value);
    return (
        <div
            ref={selectRef}
            className={styles.customSelect}
            style={{ flex: isFull ? 1 : 'none' }}
        >
            <div className={styles.selectButton} >
                <div className={styles.selectButtonInfo} onClick={() => setOpen(prev => !prev)}>
                    {label && <p className={styles.selectLabel}>{label}</p>}
                    <p className={styles.selectValue}>{value || placeholder}</p>
                </div>
                <div className={styles.arrow}>
                    <Icon name="downArrow" size={24} />
                </div>
                <div className={styles.arrowMob}>
                    <Icon name="downArrow" size={24} color="#FE732E" />
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
                                    <Icon name={option.icon} size={16} />
                                )}
                                {option.name}
                            </div>
                            {value === option.name && (
                                <Icon name={'optionCheck'} size={16}/>
                            )}
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
};

export default Select;
