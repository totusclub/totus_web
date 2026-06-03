import styles from './search.module.css';
import Icon from "@/components/icons/Icon";
import { useEffect, useRef, useState } from "react";
import { fetchDestinations } from "@/store/slices/destinationsSlice";
import { useDispatch, useSelector } from "react-redux";
import { RootState, AppDispatch } from "@/store";
import { setHeaderName } from '@/store/slices/searchSlice';
import Image from 'next/image';

interface DestinationItem {
    id?: string | number;
    name?: string;
    name_ru?: string;
    name_en?: string;
    iso2?: string;
    image?: string;
    visa_type?: string;
    active_regions?: string;
    description?: string;
    country_name_ru?: string;
    city_name?: string;
    [key: string]: string | number | boolean | undefined;
}

interface WhereToProps {
    handleChange: (value: DestinationItem | string | number | number[], key: string, type: string) => void;
    value?: string;
    name: string;
    searchType?: 'package' | 'hotel';
    fromCity?: string;
}

const WhereFrom = ({ handleChange, value, name, searchType = 'package', fromCity = 'Moscow' }: WhereToProps) => {
    const dispatch = useDispatch<AppDispatch>();
    const inputRef = useRef<HTMLInputElement | null>(null);
    const wrapperRef = useRef<HTMLDivElement>(null);
    const [isOpen, setIsOpen] = useState(false);
    const [searchValue, setSearchValue] = useState("");
    const { data } = useSelector((state: RootState) => state.destinations);

    // Type guard for data structure
    interface DataGroup {
        group_name?: string;
        results?: DestinationItem[];
    }

    const isDataGroup = (item: unknown): item is DataGroup => {
        return typeof item === 'object' && item !== null && 'group_name' in item;
    };


    useEffect(() => {
        const timeoutId = setTimeout(() => {
            dispatch(
                fetchDestinations({
                    query: searchValue,
                    from_city: fromCity,
                    search_type: searchType,
                } as unknown as undefined)
            );
        }, 500); // debounce 500ms

        return () => clearTimeout(timeoutId);
    }, [searchValue, dispatch, fromCity, searchType]);

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

    const handleSelect = (type: string, item: DestinationItem) => {
        const displayName = item.name || item.name_ru || item.name_en || '';
        setSearchValue(displayName);
        dispatch(setHeaderName(displayName));
        handleChange(item, name, type);
        setIsOpen(false);
    };


    useEffect(() => {
        if (isOpen && inputRef.current) {
            inputRef.current.focus();
            inputRef.current.select();
        }
    }, [isOpen]);

    // Initialize searchValue from value prop
    useEffect(() => {
        if (value && !searchValue) {
            setSearchValue(value);
        }
    }, [value, searchValue]);

    // Fetch destinations on mount when modal opens
    useEffect(() => {
        if (isOpen && !searchValue) {
            dispatch(
                fetchDestinations({
                    query: " ",
                    from_city: fromCity,
                    search_type: searchType,
                } as unknown as undefined)
            );
        }
    }, [isOpen, dispatch, searchValue, fromCity, searchType]);

    const ignorName = ['Крым', 'Донецк', 'Луганск', 'Ялта', 'Yalta']

    // Get popular destinations from API data - only countries with images
    const getPopularDestinations = (): DestinationItem[] => {
        if (!data || !Array.isArray(data)) return [];

        const countriesData = data.find((item: unknown) =>
            isDataGroup(item) && item.group_name === "countries"
        ) as DataGroup | undefined;
        const apiCountries: DestinationItem[] = countriesData?.results || [];

        // Return only countries that have images
        return apiCountries.filter((c: DestinationItem) => c.image && c.image.trim() !== '');
    };

    // Get other countries - only those with images (since we only show destinations with images)
    const getOtherCountries = (): DestinationItem[] => {
        if (!data || !Array.isArray(data)) return [];

        const countriesData = data.find((item: unknown) =>
            isDataGroup(item) && item.group_name === "countries"
        ) as DataGroup | undefined;
        const apiCountries: DestinationItem[] = countriesData?.results || [];
        const popularIso2s = getPopularDestinations().map(d => d.iso2 || '');

        // Return countries with images that are not in popular destinations
        return apiCountries.filter((c: DestinationItem) =>
            c.image &&
            c.image.trim() !== '' &&
            !popularIso2s.includes(c.iso2 || '')
        );
    };

    return (
        <div className={`${styles.searchField} ${styles.radioFrom}`} ref={wrapperRef} onClick={handleToggle}>
            <Icon name={'to'} size={24} color="var(--textPrimary)" />
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
            <Icon name={'downArrow'} size={24} color="var(--textPrimary)" />
            {isOpen && (
                <div className={styles.whereFromModal} onClick={(e) => e.stopPropagation()}>
                    <div className={styles.whereFromModalHead}>
                        <p>Страна, город, регион или отель</p>
                        <div onClick={() => setIsOpen(false)}>
                            <Icon name={'closeLine'} size={24} color="var(--textPrimary)" />
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
                            {/* Popular destinations */}
                            {getPopularDestinations().length > 0 && (
                                <>
                                    <p className={styles?.searchGroupListText}>Популярные страны</p>
                                    {getPopularDestinations().map((c, i) => (
                                        <div
                                            key={`popular-${c.iso2 || i}`}
                                            className={styles?.searchGroupListItem}
                                            onClick={() => handleSelect('countries', c)}
                                        >
                                            {c.image && (
                                                <div className={styles.destinationImage}>
                                                    <Image
                                                        src={c.image}
                                                        alt={(c.name || c.name_ru || c.name_en || 'Destination') as string}
                                                        width={40}
                                                        height={40}
                                                        style={{ borderRadius: '50%', objectFit: 'cover' }}
                                                    />
                                                </div>
                                            )}
                                            <div className={styles.destinationInfo}>
                                                <p>{c.name || c.name_ru || c.name_en}</p>
                                                <p>{c.visa_type || ''}</p>
                                            </div>
                                        </div>
                                    ))}
                                </>
                            )}
                            {/* Other countries from API */}
                            {getOtherCountries().length > 0 && (
                                <>
                                    {getPopularDestinations().length > 0 && (
                                        <p className={styles?.searchGroupListText} style={{ marginTop: '16px' }}>Другие страны</p>
                                    )}
                                    {getOtherCountries().map((c, i) => (
                                        <div
                                            key={c?.id || `country-${i}`}
                                            className={styles?.searchGroupListItem}
                                            onClick={() => handleSelect('countries', c)}
                                        >
                                            {c.image && (
                                                <div className={styles.destinationImage}>
                                                    <Image
                                                        src={c.image}
                                                        alt={(c.name || c.name_ru || c.name_en || 'Destination') as string}
                                                        width={40}
                                                        height={40}
                                                        style={{ borderRadius: '50%', objectFit: 'cover' }}
                                                    />
                                                </div>
                                            )}
                                            <div className={styles.destinationInfo}>
                                                <p>{c.name || c.name_ru || c.name_en}</p>
                                                <p>{c.visa_type || ''}</p>
                                            </div>
                                        </div>
                                    ))}
                                </>
                            )}
                            {/* Regions */}
                            {data && Array.isArray(data) && data
                                .filter((item: unknown): item is DataGroup => isDataGroup(item) && item.group_name === "regions")
                                .flatMap((item: DataGroup) =>
                                    item?.results
                                        ?.filter((c: DestinationItem) => !ignorName.some(name => c.active_regions?.includes(name)))
                                        .map((c: DestinationItem) => (
                                            <div
                                                key={c?.id}
                                                className={styles?.searchGroupListItem}
                                                onClick={() => handleSelect('regions', c)}
                                            >
                                                {c.image && (
                                                    <div className={styles.destinationImage}>
                                                        <Image
                                                            src={c.image}
                                                            alt={(c?.name || 'Region') as string}
                                                            width={40}
                                                            height={40}
                                                            style={{ borderRadius: '50%', objectFit: 'cover' }}
                                                        />
                                                    </div>
                                                )}
                                                <div className={styles.destinationInfo}>
                                                    <p>{c?.name}</p>
                                                    <p>{c?.active_regions}</p>
                                                </div>
                                            </div>
                                        ))
                                )}
                        </div>
                        <div className={styles.searchGroupList}>
                            {data && Array.isArray(data) && data
                                .filter((item: unknown): item is DataGroup => isDataGroup(item) && item.group_name === "metaregions")
                                .flatMap((item: DataGroup) =>
                                    item?.results
                                        ?.filter((m: DestinationItem) => !ignorName.some(name => m.description?.includes(name)))
                                        .map((m: DestinationItem, i: number) => (
                                            <>
                                                {i === 0 && (
                                                    <p className={styles?.searchGroupListText}>мегарегионы</p>
                                                )}
                                                <div
                                                    key={m?.id}
                                                    className={styles?.searchGroupListItem}
                                                    onClick={() => handleSelect('metaregions', m)}
                                                >
                                                    {m.image && (
                                                        <div className={styles.destinationImage}>
                                                            <Image
                                                                src={m.image}
                                                                alt={(m?.name || 'Metaregion') as string}
                                                                width={40}
                                                                height={40}
                                                                style={{ borderRadius: '50%', objectFit: 'cover' }}
                                                            />
                                                        </div>
                                                    )}
                                                    <div className={styles.destinationInfo}>
                                                        <p>{m?.name}</p>
                                                        <p>{m.country_name_ru}</p>
                                                    </div>
                                                </div>
                                            </>
                                        ))
                                )}
                        </div>
                        <div className={styles.searchGroupList}>
                            {data && Array.isArray(data) && data
                                .filter((item: unknown): item is DataGroup => isDataGroup(item) && item.group_name === "hotels")
                                .flatMap((item: DataGroup) =>
                                    item?.results
                                        ?.filter((m: DestinationItem) => !ignorName.some(name => m.city_name?.includes(name)) && !ignorName.some(name => m.name?.includes(name)))
                                        .map((m: DestinationItem, i: number) => (
                                            <>
                                                {i === 0 && (
                                                    <p className={styles?.searchGroupListText}>Отели</p>
                                                )}
                                                <div
                                                    key={m?.id}
                                                    className={styles?.searchGroupListItem}
                                                    onClick={() => handleSelect('hotels', m)}
                                                >
                                                    {m.image && (
                                                        <div className={styles.destinationImage}>
                                                            <Image
                                                                src={m.image}
                                                                alt={(m?.name || 'Hotel') as string}
                                                                width={40}
                                                                height={40}
                                                                style={{ borderRadius: '50%', objectFit: 'cover' }}
                                                            />
                                                        </div>
                                                    )}
                                                    <div className={styles.destinationInfo}>
                                                        <p>{m?.name}</p>
                                                        <p>{m.city_name}</p>
                                                    </div>
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
