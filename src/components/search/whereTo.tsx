import styles from './search.module.css';
import Icon from "@/components/icons/Icon";
import { useEffect, useRef, useState } from "react";
import {useDestinationsSearch} from "@/hooks/useDestinationsSearch";
import {fetchDestinations} from "@/store/slices/destinationsSlice";
import {useDispatch, useSelector} from "react-redux";
import {RootState} from "@/store";

const WhereFrom = ({handleChange,value,name}) => {
    const dispatch = useDispatch();
    const wrapperRef = useRef<HTMLDivElement>(null);
    const [isOpen, setIsOpen] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);
    const [searchValue, setSearchValue] = useState("");
    // const { results, status, error,data } = useDestinationsSearch(searchValue,'Moscow');
    const { data, status, error } = useSelector((state: RootState) => state.destinations);


    useEffect(() => {
        // if (!searchValue) return;

        const timeoutId = setTimeout(() => {
            console.log("searchValue", searchValue);
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

    // useEffect(() => {
    //     console.log('results',results)
    // }, [results,status]);

    const handleToggle = () => {
        setIsOpen(prev => !prev);
        setTimeout(() => inputRef.current?.focus(), 0);
    };

    const handleSelect = (type:string,item: string) => {
        setSearchValue(item.name);

        // console.log('item1',item)
        // console.log('name1',name)
        // console.log('type1',type)
        handleChange(item,name,type);
        setIsOpen(false);
    };

    // if (status === "loading") return <p>Loading...</p>;
    if (status === "failed") return <p>Error: {error}</p>;




    return (
        <div className={`${styles.searchField} ${styles.radioFrom}`} ref={wrapperRef} onClick={handleToggle}>
            <Icon name={'to'} size={24} color="#000"/>
            <div className={styles.searchFieldInfo}>
                <p className={styles.searchFieldsLabel}>Страна или город?</p>
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
                        <p>Страна или город</p>
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
                    {/*{searchValue.trim() === "" ? (*/}
                        <div className={styles.searchGroupTyping}>
                            <div className={styles.searchGroupList}>
                            {/*<p className={styles?.searchGroupListText}>Популярные страны</p>*/}
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
                                    ?.filter(item => item?.group_name === "regions" ) // only keep countries group
                                    .flatMap(item =>
                                        item?.results?.map((c,i) => (
                                            <>

                                                <div className={styles?.searchGroupListItem}
                                                     onClick={() => handleSelect('regions', c)}>
                                                    <p key={c?.id}>{c?.name}</p>
                                                    <p>{c.visa_type}</p>
                                                </div>
                                            </>
                                        ))
                                    )}
                            </div>
                            <div className={styles.searchGroupList}>
                                {/*<p className={styles?.searchGroupListText}>мегарегионы</p>*/}
                            {data
                                ?.filter(item => item?.group_name === "metaregions" ) // only keep countries group
                                .flatMap(item =>
                                    item?.results?.map((m,i) => (
                                        <>
                                            {i === 0 && (
                                                <p className={styles?.searchGroupListText}>мегарегионы</p>
                                            )}
                                            <div className={styles?.searchGroupListItem}
                                                 onClick={() => handleSelect('metaregions', m)}>
                                                <p key={m?.id}>{m?.name}</p>
                                                <p>{m.country_name_ru}</p>
                                            </div>
                                        </>
                                    ))
                                )}
                            </div>
                            <div className={styles.searchGroupList}>
                                {/*<p className={styles?.searchGroupListText}>Отели</p>*/}
                            {data
                                ?.filter(item => item?.group_name === "hotels" ) // only keep countries group
                                .flatMap(item =>
                                    item?.results?.map((m,i) => (
                                        <>
                                            {i === 0 && (
                                                <p className={styles?.searchGroupListText}>Отели</p>
                                            )}
                                            <div className={styles?.searchGroupListItem}
                                                 onClick={() => handleSelect('hotels', m)}>
                                                <p key={m?.id}>{m?.name}</p>
                                                <p>{m.country_name_ru}</p>
                                            </div>
                                        </>


                                    ))
                                )}
                            </div>
                        </div>
                    {/*) : results.length > 0 ? (*/}
                    {/*    results.map((item) => (*/}
                    {/*        <div*/}
                    {/*            key={item.id}*/}
                    {/*            onClick={() => item?.icon === 'location' ? null : handleSelect(item)}*/}
                    {/*            className={styles.locationItem}*/}
                    {/*        >*/}
                    {/*            <Icon name={item.icon} size={24} color="#000"/>*/}
                    {/*            <div>*/}
                    {/*                <p className={styles.locationItemName}>{item.name}</p>*/}
                    {/*                <p className={styles.locationItemType}>{item.type}</p>*/}
                    {/*            </div>*/}
                    {/*        </div>*/}
                    {/*    ))*/}
                    {/*) : (*/}
                    {/*    <p className={styles.noResults}>Ничего не найдено</p>*/}
                    {/*)}*/}
                </div>
            )}
        </div>
    );
};

export default WhereFrom;
