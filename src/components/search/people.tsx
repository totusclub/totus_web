import { useState, useEffect, useRef } from "react";
import styles from './search.module.css';
import Icon from "@/components/icons/Icon";


const People = ({handleChange,value}) => {
    const [adults, setAdults] = useState<number>(1);
    const [children, setChildren] = useState<number>(0);
    const [isOpen, setIsOpen] = useState<boolean>(false);
    const wrapperRef = useRef<HTMLDivElement>(null);

    const handleAdults = (type: 'plus' | 'minus') => {
        setAdults(prev => {
            if (type === 'plus') return prev + 1;
            if (type === 'minus' && prev > 1) return prev - 1;
            handleChange(adults,'adults')
            return prev;
        });
    };

    const handleChildren = (type: 'plus' | 'minus') => {
        setChildren(prev => {
            if (type === 'plus') return prev + 1;
            if (type === 'minus' && prev > 0) return prev - 1;
            return prev;
        });
    };

    const handleToggle = () => {
        setIsOpen(prev => !prev);
    };

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

    return (
        <div className={`${styles.searchField} ${styles.people}`} ref={wrapperRef} onClick={handleToggle}>
            <Icon name={'user'} size={24} color="#000" />
            <div className={styles.searchFieldInfo}>
                <p className={styles.searchFieldsLabel}>Туристы</p>
                <p className={styles.searchFieldsValue}>
                    {adults + children} турист{(adults + children) === 1 ? '' : 'а'}
                </p>
            </div>
            <Icon name={'downArrow'} size={24} color="#000" />

            {isOpen && (
                <div className={styles.modalPeople} onClick={(e) => e.stopPropagation()}>
                    <p className={styles.modalPeopleTitle}>Туристы</p>
                    <div className={styles.modalPeopleCounter}>
                        <div>
                            <p className={styles.modalPeopleCounterTitle}>Взрослые</p>
                            <p className={styles.modalPeopleCounterText}>от 17 лет и старше</p>
                        </div>
                        <ul>
                            <li onClick={() => handleAdults('minus')}>
                                <Icon name={'minus'} size={20} color="#000" />
                            </li>
                            <li>{adults}</li>
                            <li onClick={() => handleAdults('plus') }>
                                <Icon name={'plus'} size={20} color="#000" />
                            </li>
                        </ul>
                    </div>
                    <div className={styles.modalPeopleCounter}>
                        <div>
                            <p className={styles.modalPeopleCounterTitle}>Дети</p>
                            <p className={styles.modalPeopleCounterText}>от 0 до 16 лет</p>
                        </div>
                        <ul>
                            <li onClick={() => handleChildren('minus')}>
                                <Icon name={'minus'} size={20} color="#000" />
                            </li>
                            <li>{children}</li>
                            <li onClick={() => handleChildren('plus')}>
                                <Icon name={'plus'} size={20} color="#000" />
                            </li>
                        </ul>
                    </div>
                </div>
            )}
        </div>
    );
};

export default People;
