import styles from './itemSwitch.module.css';
import Switch from "@/components/UI/switch";
import type { ReactNode } from 'react';

interface ItemSwitchProps {
    isOn: boolean;
    setIsOn: (name:string,value: boolean) => void;
    title:string;
    isFull?: boolean;
    name: string;
    /** Иконка слева от подписи (набор Totus). */
    icon?: ReactNode;
}

const ItemSwitch = ({isOn,setIsOn,title,isFull,name,icon}: ItemSwitchProps) => {
    const handleToggle = (type:boolean) => {
        setIsOn(name,type);
    }

    return (
        // Вся строка переключает фильтр (подпись и иконка тоже), курсор — указатель.
        // Сам Switch останавливает всплытие клика, поэтому двойного переключения нет.
        <div
            className={styles.itemSwitch}
            style={{flex:isFull?1:'none'}}
            role="switch"
            aria-checked={isOn}
            tabIndex={0}
            onClick={() => handleToggle(!isOn)}
            onKeyDown={(e) => {
                if (e.key === ' ' || e.key === 'Enter') {
                    e.preventDefault();
                    handleToggle(!isOn);
                }
            }}
        >
            {icon ? (
                <span className={styles.itemSwitchLabel}>
                    {icon}
                    <p className={styles.itemSwitchTitle}>{title}</p>
                </span>
            ) : (
                <p className={styles.itemSwitchTitle}>{title}</p>
            )}
            <Switch isOn={isOn} setIsOn={handleToggle}/>
        </div>
    );
};

export default ItemSwitch;
