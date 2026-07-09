import styles from './search.module.css';
import Icon from "@/components/icons/Icon";
import {useEffect, useRef, useState} from "react";
import RangeStep from "@/components/UI/range";
// import SwitchToggle from "@/components/UI/switch"; // ±2 nights UI disabled
import Button from "@/components/UI/button";

// ±2 nights toggle (flex_dates) disabled — exact nights only.

const STEP = 1;
const MIN = 1;
const MAX = 30;


const Nights = ({handleChange,value,name, flexDates = '0'}) => {
    const [values, setValues] = useState([7]);
    const [isOpen, setIsOpen] = useState<boolean>(false);
    const [, setIsOn] = useState<boolean>(false);
    const wrapperRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, []);

    useEffect(() => {
        const parsed = Number(String(value).split('..')[0]);
        if (Number.isFinite(parsed) && parsed >= MIN && parsed <= MAX) {
            setValues([parsed]);
        }
    }, [value]);

    useEffect(() => {
        // ±2 nights sync disabled
        // setIsOn(Number(flexDates) === 2);
        setIsOn(false);
    }, [flexDates]);

    const handleToggle = () => {
        setIsOpen(prev => !prev);
    };

    const handleChangeNights = e => {
        setValues(e)
        handleChange(e[0],name)
    }

    return (
        <div className={styles.searchField} ref={wrapperRef} onClick={handleToggle}>
            <Icon name={'moon'} size={24} color="var(--textPrimary)"/>
            <div className={styles.searchFieldInfo}>
                <p className={styles.searchFieldsLabel}>Количество ночей</p>
                <p className={styles.searchFieldsValue}>{values[0]} ночей</p>
            </div>
            <Icon name={'downArrow'} size={24} color="var(--textPrimary)"/>
            {isOpen && (
                <div className={styles.nightsModal} onClick={(e) => e.stopPropagation()}>
                    <div className={styles.nightsModalHead}>
                        <p>Количество ночей: {values[0]}</p>
                    </div>
                    <RangeStep  step={STEP} min={MIN} max={MAX} values={values} setValues={handleChangeNights}/>
                    {/* ±2 nights UI disabled
                    <div className={styles.nightsModalFooter}>
                        <div>
                            <p>Длительность тура ±2 ночи</p>
                            <p>Бывает выгоднее</p>
                        </div>
                        <SwitchToggle
                            isOn={isOn}
                            setIsOn={(enabled) => {
                                setIsOn(enabled);
                                handleChange(enabled ? '2' : '0', 'flex_dates');
                            }}
                        />
                    </div>
                    */}
                    <div className={styles.nightsFooter}>
                        <Button onClick={()=>setIsOpen(false)} full={true} title={'Готово'}/>
                    </div>

                </div>
            )}
        </div>
    );
};

export default Nights;
