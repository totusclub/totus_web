import React from 'react';
import Icon from "@/components/icons/Icon";

interface CheckboxProps {
    option: any;
    checked: boolean;
    handleToggle: (value: number | string) => void;
    value: number | string;
}

/** Только картинка чекбокса: клик обрабатывает строка CheckboxGroup (вся строка кликабельна). */
export default function Checkbox({ checked }: CheckboxProps) {
    return <Icon name={checked ? 'checkBoxActive' : 'checkBox'} size={24} />;
}
