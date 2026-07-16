import React from 'react';
import Icon from "@/components/icons/Icon";

interface CheckboxProps {
    option: any;
    checked: boolean;
    handleToggle: (value: number | string) => void;
    value: number | string;
}

export default function Checkbox({ checked, handleToggle, value }: CheckboxProps) {
    return (
        <Icon
            name={checked ? 'checkBoxActive' : 'checkBox'}
            size={24}
            onClick={() => handleToggle(value)}
        />
    );
}
