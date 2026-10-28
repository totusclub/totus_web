import styles from './search.module.css';
import Icon from "@/components/icons/Icon";
import { useEffect, useRef, useState } from "react";
import {useDepartureSearch} from "@/hooks/useDepartureSearch";

const WhereFrom = ({handleChange,value,name}) => {
    const wrapperRef = useRef<HTMLDivElement>(null);
    const [isOpen, setIsOpen] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);
    // searchValue — текст в поле (после выбора — название города),
    // query — по чему фильтруется список. После выбора и при каждом открытии
    // query пустой, поэтому список снова показывает все города, а не только выбранный.
    const [searchValue, setSearchValue] = useState("");
    const [query, setQuery] = useState("");
    const { results, status, error } = useDepartureSearch(query);

    const handleInput = (text: string) => {
        setSearchValue(text);
        setQuery(text);
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

    const handleToggle = () => {
        setIsOpen(prev => !prev);
        setTimeout(() => inputRef.current?.focus(), 0);
    };

    const handleSelect = (item: string) => {
        setSearchValue(item?.name);
        setQuery("");
        if(item.iata){
            handleChange(item,name)
        }else{
            handleChange(item,name)
        }
        setIsOpen(false);
    };


    useEffect(() => {
        if (!isOpen) return;
        // Открыли список — показываем все города; выбранное название выделено,
        // первая же буква заменит его и начнёт поиск.
        setQuery("");
        if (inputRef.current) {
            inputRef.current.focus();
            inputRef.current.select();
        }
    }, [isOpen]);
    // if (status === "loading") return <p>Loading...</p>;
    // if (status === "failed") return <p>Error: {error}</p>;
    return (
        <div className={`${styles.searchField} ${styles.whereFrom}`} ref={wrapperRef} onClick={handleToggle}>
            <Icon name="from" size={24} color="var(--textPrimary)" />
            <div className={styles.searchFieldInfo}>
                <p className={styles.searchFieldsLabel}>Откуда?</p>
                <input
                    className={styles.searchFieldsValue}
                    type="text"
                    ref={inputRef}
                    value={searchValue}
                    onChange={(e) => handleInput(e.target.value)}
                    onClick={(e) => {
                        e.stopPropagation();
                        setIsOpen(true);
                    }}
                    placeholder="Москва"
                />
            </div>
            <Icon name="downArrow" size={24} color="var(--textPrimary)" />
            {isOpen && (
                <div className={styles.whereFromModal} onClick={(e) => e.stopPropagation()}>
                    <div className={styles.whereFromModalHead}>
                        <p>Город вылета</p>
                        <div onClick={()=>setIsOpen(false)}>
                            <Icon name={'closeLine'} size={24} color="var(--textPrimary)" />
                        </div>
                    </div>
                    <div className={styles.searchFieldInfoM}>
                        <input
                            className={styles.searchFieldsValue}
                            type="text"
                            ref={inputRef}
                            value={searchValue}
                            onChange={(e) => handleInput(e.target.value)}
                            onClick={(e) => {
                                e.stopPropagation();
                                setIsOpen(true);
                            }}
                            placeholder="Москва"
                        />
                    </div>

                    {results.length > 0 ? (
                        results.map((item) => (
                            <div
                                key={item.id}
                                onClick={() => handleSelect(item)}
                                className={styles.locationItem}
                            >
                                <Icon name={item.icon} size={24} color="var(--textPrimary)" />
                                <div>
                                    <p className={styles.locationItemName}>{item.name}</p>
                                    <p className={styles.locationItemType}>{item.type}</p>
                                </div>
                            </div>
                        ))
                    ) : query.trim() === "" ? (
                        status === "loading" ? (
                            <p className={styles.noResults}>Загрузка...</p>
                        ) : (
                            <p className={styles.noResults}>Список городов пуст</p>
                        )
                    ) : (
                        <p className={styles.noResults}>Ничего не найдено</p>
                    )}
                </div>
            )}
        </div>
    );
};

export default WhereFrom;
