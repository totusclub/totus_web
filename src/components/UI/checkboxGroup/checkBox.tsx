
import React, {useEffect, useMemo, useState} from 'react';
import styles from './checkboxGroup.module.css';
import Icon from "@/components/icons/Icon";


interface CheckboxGroupProps {
    option: any;
    handleToggle:any

}

export default function Checkbox({ option, handleToggle }: CheckboxGroupProps) {
    const [checked, setChecked] = useState<boolean>(false);


    useEffect(() => {
        if(option.selected){
            setChecked(option.selected)
        }
    }, [option]);


    const handleChange = (e) => {
        setChecked(!checked)
        handleToggle(e)
    }

    return (
        <Icon
            name={checked ? 'checkBoxActive' : 'checkBox'}
            size={24}
            onClick={() =>
                handleChange(
                    option.id ||
                    option.luggage_type ||
                    option.flight_class ||
                    option.number ||
                    option.flight_type
                )
            }
        />
    );
}
