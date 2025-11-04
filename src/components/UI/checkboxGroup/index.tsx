import React, {useEffect, useMemo, useState} from 'react';
import styles from './checkboxGroup.module.css';
import Icon from "@/components/icons/Icon";
import Checkbox from '@/components/UI/checkboxGroup/checkBox';

interface Option {
    id: number | string;
    name: string;
}

interface CheckboxGroupProps {
    options: Option[];
    selected: (number | string)[];
    onChange: (key?:string, selected?: (number | string)[]) => void;
    name?:string
    pk?:boolean,
    netPrice:number,
}


export default function CheckboxGroup({options, selected, onChange,name,pk,netPrice}: CheckboxGroupProps) {
    useEffect(() => {
        if(selected){
            const values = Array.isArray(selected)
                ? selected
                : typeof selected === 'string'
                    ? selected.split(',')
                    : [];
        }
    }, [selected]);

    const handleToggle = (id: number | string) => {
        const selectedIds = options
            .filter(item => item.selected)
            .map(item => item.id || item.luggage_type || item.flight_class || item.number || item.flight_type);
        if (selectedIds.includes(id)) {
            onChange(name,selectedIds.filter((item) => item !== id).join(','));
        } else {
            onChange(name,[...selectedIds, id].join(','));
        }
    };

    const loacalActive = useMemo(() => {
        if (selected && name === 'filter_hotel_type') {
            return true
        }
    },[selected,name])


    const renderName =(item)=>{
        if(name==='filter_stars'){
            if(item.id === '5'){
                return `${item.id} звёзд`
            }else if(item.id  === '1'){
                return `${item.id} звезда`
            }else{
                return `${item.id} звезды`
            }
        }else if(
            name==='filter_regions' ||
            name==='filter_meals' ||
            name==='filter_hotel_type' ||
            name==='filter_operators' ||
            name === 'forward_airlines' ||
            name === 'operators'
        ) {
            return item.name;
        }else if( name === 'luggage_types'){
            if(item.luggage_type === 'all'){
                return 'Все'
            }else if(item.luggage_type === 'hold'){
                return 'С багажом'
            }else if(item.luggage_type === 'heavy'){
                return 'С багажом от 20кг'
            }
        }else if(name==='filter_line'){
            return `${item.id}-я линия`
        }else if(name==='flight_classes'){
            if(item.flight_class === 'econom'){
                return 'Эконом'
            }else if(item.flight_class ==='business'){
                return 'Бизнес'
            }
        }else if(name==='flight_types'){
            if(item.flight_type === 'regular'){
                return 'Регулярный рейс'
            }else if(item.flight_type === 'charter'){
                return 'Чартерный рейс'
            }
        }else if(name==='transitions_count'){
            if(item.number === 0){
                return 'Без пересадки'
            }else{
                return `${item.number} пересадка`
            }
        }
    }

    const allOptions= useMemo(()=>{
        return [...options]

    },[options])



    return (
        <div className={styles.wrapperGroupCheckbox}>
            {allOptions?.map((option) => !option.disabled && (
                <div key={option.id} className={styles.checkboxItem} >
                    <Checkbox option={option} handleToggle={handleToggle} />
                    {/*<Icon name={option.selected? 'checkBoxActive':'checkBox'} size={24} onClick={() => handleToggle(option.id || option.luggage_type || option.flight_class || option.number || option.flight_type)} />*/}
                    <div>
                        <p onClick={() => handleToggle(option.id || option.luggage_type || option.flight_class || option.number || option.flight_type)}>{renderName(option)}</p>
                        {!pk && (
                            <span> {option?.hotel_count} отелей от {option?.min_price?.toString()?.replace(/\B(?=(\d{3})+(?!\d))/g, '\u202F')}₽</span>
                        )}
                        {pk && (
                            <span> {option?.suitable_flights} рейса от {(netPrice+option?.min_fuel_charge)?.toString()?.replace(/\B(?=(\d{3})+(?!\d))/g, '\u202F')}₽</span>
                        )}
                    </div>
                </div>
            ))}
        </div>
    );
}
