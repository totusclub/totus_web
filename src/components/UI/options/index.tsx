import React, { useState } from 'react';
import styles from './options.module.css';

export interface Option {
    id: string | number;
    name: string;
}

interface OptionsProps {
    title: string;
    options: Option[];
    onSelect: (option: Option) => void;
}

const Options: React.FC<OptionsProps> = ({ title, options, onSelect }) => {
    const [selectedId, setSelectedId] = useState<string | number | null>(null);

    const handleSelect = (option: Option) => {
        setSelectedId(option.id);
        onSelect(option);
    };

    return (
        <div className={styles.optionsWrap}>
            <p className={styles.optionTitle}>{title}</p>
            <div className={styles.optionsList}>
                {options.map((option) => (
                    <div
                        className={styles.optionButtonWrap}
                        key={option.id}
                        onClick={() => handleSelect(option)}
                    >
                        <div
                            className={`${styles.optionButton} ${
                                selectedId === option.id ? styles.selected : ''
                            }`}
                        />
                        <p>{option.name}</p>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default Options;
