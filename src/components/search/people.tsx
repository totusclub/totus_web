import { useState, useEffect, useRef } from "react";
import styles from './search.module.css';
import Icon from "@/components/icons/Icon";
import Button from "@/components/UI/button";

// Age options for children dropdown
const getAgeOptions = () => {
    const options = [
        { value: 0, name: 'до 1 года' },
        { value: 1, name: '1 год' },
        { value: 2, name: '2 года' },
        { value: 3, name: '3 года' },
        { value: 4, name: '4 года' },
        { value: 5, name: '5 лет' },
        { value: 6, name: '6 лет' },
        { value: 7, name: '7 лет' },
        { value: 8, name: '8 лет' },
        { value: 9, name: '9 лет' },
        { value: 10, name: '10 лет' },
        { value: 11, name: '11 лет' },
        { value: 12, name: '12 лет' },
        { value: 13, name: '13 лет' },
        { value: 14, name: '14 лет' },
        { value: 15, name: '15 лет' },
        { value: 16, name: '16 лет' },
        { value: 17, name: '17 лет' },
    ];
    return options;
};

const People = ({ handleChange, value }) => {
    const [adults, setAdults] = useState<number>(1);
    const [children, setChildren] = useState<number>(0);
    const [childrenAges, setChildrenAges] = useState<number[]>([]);
    const [isOpen, setIsOpen] = useState<boolean>(false);
    const [openAgeDropdowns, setOpenAgeDropdowns] = useState<{ [key: number]: boolean }>({});
    const wrapperRef = useRef<HTMLDivElement>(null);
    const ageDropdownRefs = useRef<{ [key: number]: HTMLDivElement | null }>({});

    const ageOptions = getAgeOptions();

    // Initialize from value prop if provided
    useEffect(() => {
        if (value?.adults) {
            setAdults(parseInt(value.adults) || 1);
        }
        if (value?.kids) {
            const kidsCount = parseInt(value.kids) || 0;
            setChildren(kidsCount);
            if (value?.kids_ages && Array.isArray(value.kids_ages)) {
                setChildrenAges([...value.kids_ages]);
            } else {
                setChildrenAges(Array(kidsCount).fill(1)); // Default age 8
            }
        }
    }, [value]);

    const handleAdults = (type: 'plus' | 'minus') => {
        setAdults(prev => {
            let newValue = prev;

            if (type === 'plus') {
                newValue = prev + 1;
            } else if (type === 'minus' && prev > 1) {
                newValue = prev - 1;
            }

            // Call with the updated value
            handleChange(newValue, 'adults');

            return newValue;
        });
    };

    const handleChildren = (type: 'plus' | 'minus') => {
        setChildren(prev => {
            let newValue = prev;

            if (type === 'plus') {
                newValue = prev + 1;
                // Add default age 8 for new child
                setChildrenAges(prevAges => [...prevAges, 1]);
            } else if (type === 'minus' && prev > 0) {
                newValue = prev - 1;
                // Remove last child's age
                setChildrenAges(prevAges => prevAges.slice(0, -1));
            }

            // Update kids_ages array
            const updatedAges = type === 'plus'
                ? [...childrenAges, 1]
                : childrenAges.slice(0, -1);

            handleChange({ kids: newValue.toString(), kids_ages: updatedAges }, 'kids');
            return newValue;
        });
    };

    const handleAgeChange = (childIndex: number, age: number) => {
        const updatedAges = [...childrenAges];
        updatedAges[childIndex] = age;
        setChildrenAges(updatedAges);
        handleChange({ kids: children.toString(), kids_ages: updatedAges }, 'kids');
        setOpenAgeDropdowns({ ...openAgeDropdowns, [childIndex]: false });
    };

    const toggleAgeDropdown = (childIndex: number) => {
        setOpenAgeDropdowns(prev => ({
            ...prev,
            [childIndex]: !prev[childIndex]
        }));
    };

    const handleToggle = () => {
        setIsOpen(prev => !prev);
    };

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
            // Close age dropdowns when clicking outside
            Object.keys(ageDropdownRefs.current).forEach(key => {
                const ref = ageDropdownRefs.current[parseInt(key)];
                if (ref && !ref.contains(event.target as Node)) {
                    setOpenAgeDropdowns(prev => ({ ...prev, [parseInt(key)]: false }));
                }
            });
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
                            <li onClick={() => handleAdults('plus')}>
                                <Icon name={'plus'} size={20} color="#000" />
                            </li>
                        </ul>
                    </div>
                    <div className={styles.modalPeopleCounter}>
                        <div>
                            <p className={styles.modalPeopleCounterTitle}>Дети</p>
                            <p className={styles.modalPeopleCounterText}>от 0 до 17 лет</p>
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
                    {children > 0 && (
                        <>
                            <div className={styles.kidsAgeInfo}>
                                <Icon name={'info'} size={16} color="#7a7a7a" />
                                <p>Укажите возраст детей на момент окончания поездки</p>
                            </div>
                            <div className={styles.kidsAgeDropdowns}>
                                {Array.from({ length: children }).map((_, index) => {
                                    const selectedAge = ageOptions.find(opt => opt.value === childrenAges[index]);
                                    return (
                                        <div
                                            key={index}
                                            className={styles.kidsAgeDropdownWrapper}
                                            ref={(el) => { ageDropdownRefs.current[index] = el; }}
                                        >
                                            <div
                                                className={styles.kidsAgeDropdown}
                                                onClick={() => toggleAgeDropdown(index)}
                                            >
                                                <p className={styles.kidsAgePlaceholder}>
                                                    {selectedAge ? selectedAge.name : 'Выберите возраст ребенка'}
                                                </p>
                                                <Icon name={'downArrow'} size={20} color="#000" />
                                            </div>
                                            {openAgeDropdowns[index] && (
                                                <ul className={styles.kidsAgeOptions}>
                                                    {ageOptions.map((option) => (
                                                        <li
                                                            key={option.value}
                                                            onClick={() => handleAgeChange(index, option.value)}
                                                            className={childrenAges[index] === option.value ? styles.selected : ''}
                                                        >
                                                            {option.name}
                                                        </li>
                                                    ))}
                                                </ul>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </>
                    )}
                    <div className={styles.nightsFooter}>
                        <Button onClick={() => setIsOpen(false)} full={true} title={'Готово'} />
                    </div>
                </div>
            )}
        </div>
    );
};

export default People;
