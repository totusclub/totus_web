import React from 'react';
import styles from './checkboxGroup.module.css';
import Icon from "@/components/icons/Icon";

interface Option {
    id: number | string;
    name: string;
}

interface CheckboxGroupProps {
    options: Option[];
    selected: (number | string)[];
    onChange: (selected: (number | string)[]) => void;
}

export default function CheckboxGroup({options, selected, onChange,}: CheckboxGroupProps) {

    const handleToggle = (id: number | string) => {
        if (selected.includes(id)) {
            onChange(selected.filter((item) => item !== id));
        } else {
            onChange([...selected, id]);
        }
    };

    return (
        <div className={styles.wrapperGroupCheckbox}>
            {options.map((option) => (
                <div key={option.id} className={styles.checkboxItem}  >
                    <Icon name={selected.includes(option.id)? 'checkBoxActive':'checkBox'} size={24} onClick={() => handleToggle(option.id)} />
                    <span onClick={() => handleToggle(option.id)}>{option.name}</span>
                </div>
            ))}
        </div>
    );
}
