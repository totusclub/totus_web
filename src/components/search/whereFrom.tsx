import styles from './search.module.css';
import Icon from "@/components/icons/Icon";
import {useEffect, useRef, useState} from "react";


const MOCK_DATA = [
    {id:1,name:'Dubai, United Arab Emirates',icon:'location',type:'Город'},
    {id:2,name:'Dubai, United Arab Emirates YUL',icon:'plane',type:'Dubai Intl'},
    {id:3,name:'Dubai, United Arab Emirates DWC',icon:'plane',type:'Al Maktoum Intl'},
    {id:4,name:'Dubai International Hotel',icon:'hotel',type:'Dubai, United Arab Emirates'},
    {id:5,name:'Dubai Mall, Dubai, United Arab Emirates',icon:'circle',type:'Landmark'},
]

const WhereFrom = () => {
    const wrapperRef = useRef<HTMLDivElement>(null);
    const [isOpen, setIsOpen] = useState<boolean>(false);
    const inputRef = useRef<HTMLInputElement>(null);
    const [searchValue, setSearchValue] = useState<string>('');
    const [filteredData, setFilteredData] = useState(MOCK_DATA);

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
        const filtered = MOCK_DATA.filter(item =>
            item.name.toLowerCase().includes(searchValue.toLowerCase())
        );
        setFilteredData(filtered);
    }, [searchValue]);

    const handleToggle = () => {
        setIsOpen(prev => !prev);
        setTimeout(() => {
            inputRef.current?.focus();
        }, 0);
    };

    const handleSelect = (name: string) => {
        setSearchValue(name);
        setIsOpen(false);
    };

    return (
        <div className={`${styles.searchField} ${styles.whereFrom}`} ref={wrapperRef} onClick={handleToggle}>
            <Icon name={'from'} size={24} color="#000" />
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
            <Icon name={'downArrow'} size={24} color="#000" />
            {isOpen && (
                <div className={styles.whereFromModal} onClick={(e) => e.stopPropagation()}>
                    {filteredData.length > 0 ? (
                        filteredData.map((item) => (
                            <div onClick={() => handleSelect(item.name)}  className={styles.locationItem} key={item.id}>
                                <Icon name={item.icon} size={24} color="#000" />
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
