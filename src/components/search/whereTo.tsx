import styles from './search.module.css';
import Icon from "@/components/icons/Icon";
import { useEffect, useRef, useState } from "react";
import {useDestinationsSearch} from "@/hooks/useDestinationsSearch";
import {fetchDestinations} from "@/store/slices/destinationsSlice";
import {useDispatch, useSelector} from "react-redux";
import {RootState} from "@/store";
import {setHeaderName} from '@/store/slices/searchSlice';

const WhereFrom = ({handleChange,value,name}) => {
    const dispatch = useDispatch();
    const inputRef = useRef<HTMLInputElement | null>(null);
    const wrapperRef = useRef<HTMLDivElement>(null);
    const [isOpen, setIsOpen] = useState(false);
    const [searchValue, setSearchValue] = useState("");
    // const { results, status, error,data } = useDestinationsSearch(searchValue,'Moscow');
    const { data, status, error } = useSelector((state: RootState) => state.destinations);


    useEffect(() => {
        const timeoutId = setTimeout(() => {
            dispatch(
                fetchDestinations({
                    query: searchValue,
                    from_city: "Moscow",
                    search_type: "package",
                })
            );
        }, 500); // debounce 500ms

        return () => clearTimeout(timeoutId);
    }, [searchValue, dispatch]);

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

    const handleSelect = (type:string,item: string) => {
        setSearchValue(item.name);
        dispatch(setHeaderName(item.name))
        handleChange(item,name,type);
        setIsOpen(false);
    };


    useEffect(() => {
        if (isOpen && inputRef.current) {
            inputRef.current.focus();
            inputRef.current.select();
        }
    }, [isOpen]);

    // if (status === "failed") return <p>Error: {error}</p>;


const ignorName = ['Крым', 'Донецк', 'Луганск', 'Ялта','Yalta']

    return (
        <div className={`${styles.searchField} ${styles.radioFrom}`} ref={wrapperRef} onClick={handleToggle}>
            <Icon name={'to'} size={24} color="#000"/>
            <div className={styles.searchFieldInfo}>
                <p className={styles.searchFieldsLabel}>Страна, город, регион или отель</p>
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
                    placeholder="Египет"
                />
            </div>
            <Icon name={'downArrow'} size={24} color="#000"/>
            {isOpen && (
                <div className={styles.whereFromModal} onClick={(e) => e.stopPropagation()}>
                    <div className={styles.whereFromModalHead}>
                        <p>Страна, город, регион или отель</p>
                        <div onClick={() => setIsOpen(false)}>
                            <Icon name={'closeLine'} size={24} color="#000"/>
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
                        <div className={styles.searchGroupTyping}>
                            <div className={styles.searchGroupList}>
                            {data
                                ?.filter(item => item?.group_name === "countries" ) // only keep countries group
                                .flatMap(item =>
                                    item?.results?.map((c,i) => (
                                        <>
                                        {i === 0 && (
                                            <p className={styles?.searchGroupListText}>Популярные страны</p>
                                        )}
                                        <div className={styles?.searchGroupListItem} onClick={() => handleSelect('countries',c)}>
                                            <p key={c?.id}>{c?.name}</p>
                                            <p>{c.visa_type}</p>
                                        </div>
                                        </>
                                    ))
                                )}
                                {data
                                    ?.filter(item => item?.group_name === "regions") // only keep regions group
                                    .flatMap(item =>
                                        item?.results
                                            ?.filter(c => !ignorName.some(name => c.active_regions?.includes(name))) // filter out ignored regions
                                            .map((c, i) => (
                                                <div
                                                    key={c?.id}
                                                    className={styles?.searchGroupListItem}
                                                    onClick={() => handleSelect('regions', c)}
                                                >
                                                    <p>{c?.name}</p>
                                                    <p>{c?.active_regions}</p>
                                                </div>
                                            ))
                                    )}
                            </div>
                            <div className={styles.searchGroupList}>
                                {data
                                    ?.filter(item => item?.group_name === "metaregions") // only keep metaregions group
                                    .flatMap(item =>
                                        item?.results
                                            ?.filter(m => !ignorName.some(name => m.description?.includes(name))) // skip ignored countries
                                            .map((m, i) => (
                                                <>
                                                    {i === 0 && (
                                                        <p className={styles?.searchGroupListText}>мегарегионы</p>
                                                    )}
                                                    <div
                                                        className={styles?.searchGroupListItem}
                                                        onClick={() => handleSelect('metaregions', m)}
                                                    >
                                                        <p key={m?.id}>{m?.name}</p>
                                                        <p>{m.country_name_ru}</p>
                                                    </div>
                                                </>
                                            ))
                                    )}
                            </div>
                            <div className={styles.searchGroupList}>
                                {data
                                    ?.filter(item => item?.group_name === "hotels") // only keep hotels group
                                    .flatMap(item =>
                                        item?.results
                                            ?.filter(m => !ignorName.some(name => m.city_name?.includes(name)) && !ignorName.some(name => m.name?.includes(name)) ) // skip ignored cities
                                            .map((m, i) => (
                                                <>
                                                    {i === 0 && (
                                                        <p className={styles?.searchGroupListText}>Отели</p>
                                                    )}
                                                    <div
                                                        className={styles?.searchGroupListItem}
                                                        onClick={() => handleSelect('hotels', m)}
                                                    >
                                                        <p key={m?.id}>{m?.name}</p>
                                                        <p>{m.city_name}</p>
                                                    </div>
                                                </>
                                            ))
                                    )}

                            </div>
                        </div>
                </div>
            )}
        </div>
    );
};

export default WhereFrom;
