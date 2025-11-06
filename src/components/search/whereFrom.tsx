import styles from './search.module.css';
import Icon from "@/components/icons/Icon";
import { useEffect, useRef, useState } from "react";
import {useDepartureSearch} from "@/hooks/useDepartureSearch";

const WhereFrom = ({handleChange,value,name}) => {
    const wrapperRef = useRef<HTMLDivElement>(null);
    const [isOpen, setIsOpen] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);
    const [searchValue, setSearchValue] = useState("");
    const { results, status, error } = useDepartureSearch(searchValue);

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

    const handleToggle = () => {
        setIsOpen(prev => !prev);
        setTimeout(() => inputRef.current?.focus(), 0);
    };

    const handleSelect = (item: string) => {
        setSearchValue(item?.name);
        if(item.iata){
            handleChange(item,name)
        }else{
            handleChange(item,name)
        }
        setIsOpen(false);
    };


    useEffect(() => {
        if (isOpen && inputRef.current) {
            inputRef.current.focus();
            inputRef.current.select();
        }
    }, [isOpen]);
    // if (status === "loading") return <p>Loading...</p>;
    // if (status === "failed") return <p>Error: {error}</p>;
    return (
        <div className={`${styles.searchField} ${styles.whereFrom}`} ref={wrapperRef} onClick={handleToggle}>
            <Icon name="from" size={24} color="#000" />
            <div className={styles.searchFieldInfo}>
                <p className={styles.searchFieldsLabel}>Откуда?</p>
                <input
                    className={styles.searchFieldsValue}
                    type="text"
                    ref={inputRef}
                    value={searchValue}
                    onChange={(e) => setSearchValue(e.target.value)}
                    onClick={(e) => {
                        e.stopPropagation();
                        setIsOpen(true);
                    }}
                    placeholder="Москва"
                />
            </div>
            <Icon name="downArrow" size={24} color="#000" />
            {isOpen && (
                <div className={styles.whereFromModal} onClick={(e) => e.stopPropagation()}>
                    <div className={styles.whereFromModalHead}>
                        <p>Город вылета</p>
                        <div onClick={()=>setIsOpen(false)}>
                            <Icon name={'closeLine'} size={24} color="#000" />
                        </div>
                    </div>
                    <div className={styles.searchFieldInfoM}>
                        <input
                            className={styles.searchFieldsValue}
                            type="text"
                            ref={inputRef}
                            value={searchValue}
                            onChange={(e) => setSearchValue(e.target.value)}
                            onClick={(e) => {
                                e.stopPropagation();
                                setIsOpen(true);
                            }}
                            placeholder="Москва"
                        />
                    </div>

                    {searchValue.trim() === "" ? (
                        // <p  className={styles.noResults}>Введите город или аэропорт</p>
                        results.map((item) => {
                            if (item.prioritized) {
                                return (
                                    <div
                                        key={item.id}
                                        onClick={() => handleSelect(item)}
                                        className={styles.locationItem}
                                    >
                                        <Icon name={item.icon} size={24} color="#000" />
                                        <div>
                                            <p className={styles.locationItemName}>{item.name}</p>
                                            <p className={styles.locationItemType}>{item.type}</p>
                                        </div>
                                    </div>
                                );
                            }
                        })
                    ) : results.length > 0 ? (
                        results.map((item) => (
                            <div
                                key={item.id}
                                onClick={() => handleSelect(item)}
                                className={styles.locationItem}
                            >
                                <Icon name={item.icon} size={24} color="#000"/>
                                <div>
                                    <p className={styles.locationItemName}>{item.name}</p>
                                    <p className={styles.locationItemType}>{item.type}</p>
                                </div>
                            </div>
                        ))
                    ) : (
                        <p className={styles.noResults}>Ничего не найдено</p>
                    )}
                </div>
            )}
        </div>
    );
};

export default WhereFrom;
