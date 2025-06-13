import React, {useMemo} from 'react';
import styles from './checkboxGroup.module.css';
import Icon from "@/components/icons/Icon";

interface Option {
    id: number | string;
    name: string;
}

interface CheckboxGroupProps {
    options: Option[];
    selected: (number | string)[];
    onChange: (key?:string, selected?: (number | string)[]) => void;
    name?:string
}

export default function CheckboxGroup({options, selected, onChange,name}: CheckboxGroupProps) {

    const handleToggle = (id: number | string) => {
        const selectedIds = options
            .filter(item => item.selected)
            .map(item => item.id);
        // console.log('options',id,selectedIds)
        if (selectedIds.includes(id)) {
            onChange(name,selectedIds.filter((item) => item !== id).join(','));
        } else {
            onChange(name,[...selectedIds, id].join(','));
        }
    };


    const renderName =(item)=>{
        if(name==='filter_stars'){
            if(item.id === '5'){
                return `${item.id} звёзд`
            }else if(item.id  === '1'){
                return `${item.id} звезда`
            }else{
                return `${item.id} звезды`
            }
        }else if(name==='filter_regions' || name==='filter_meals' || name==='filter_hotel_type' || name==='filter_operators') {
            return item.name;
        }else if(name==='filter_line'){
            return `${item.id}-я линия`
        }
    }

    const allOptions= useMemo(()=>{
        return [...options]

    },[options])

    return (
        <div className={styles.wrapperGroupCheckbox}>
            {allOptions?.map((option) => !option.disabled && (
                <div key={option.id} className={styles.checkboxItem}  >
                    <Icon name={option.selected? 'checkBoxActive':'checkBox'} size={24} onClick={() => handleToggle(option.id)} />
                    <div>
                        <p onClick={() => handleToggle(option.id)}>{renderName(option)}</p>
                       <span> {option?.hotel_count} отелей от {option?.min_price?.toString()?.replace(/\B(?=(\d{3})+(?!\d))/g, '\u202F')}₽</span>
                    </div>
                </div>
            ))}
        </div>
    );
}
