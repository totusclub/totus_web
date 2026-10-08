import styles from './search.module.css';
import Icon from "@/components/icons/Icon";
import { useEffect, useRef, useState, type ChangeEvent } from "react";
import { fetchDestinations } from "@/store/slices/destinationsSlice";
import { useDispatch, useSelector } from "react-redux";
import { RootState, AppDispatch } from "@/store";
import { setHeaderName } from '@/store/slices/searchSlice';
import Image from 'next/image';
import { API_BASE_URL } from '@/config/api';
import {
    countryImageSrc,
    DEFAULT_BROWSE_COUNTRIES,
    splitBrowseCountries,
    toBrowseCountries,
    type BrowseCountry,
} from '@/utils/countryImages';

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

/**
 * Страны для списка по нажатию на поле (до ввода текста): Level.Travel /references/destinations.
 * Один запрос на город вылета за сессию; до ответа и при ошибке — DEFAULT_BROWSE_COUNTRIES.
 * (Подсказки autocomplete_v2 с пустым текстом Level.Travel теперь возвращает пустыми.)
 */
const browseCountriesCache = new Map<string, Promise<BrowseCountry[] | null>>();
function loadBrowseCountries(fromCity: string): Promise<BrowseCountry[] | null> {
    const key = fromCity || 'Moscow';
    if (!browseCountriesCache.has(key)) {
        const request = fetch(`${API_BASE_URL}/references/destinations?from_city=${encodeURIComponent(key)}`)
            .then((r) => (r.ok ? r.json() : null))
            .then(toBrowseCountries)
            .catch(() => null)
            .then((list) => {
                if (!list) browseCountriesCache.delete(key); // ошибка — попробуем при следующем открытии
                return list;
            });
        browseCountriesCache.set(key, request);
    }
    return browseCountriesCache.get(key)!;
}

/** Кружок 40 px: картинка страны или первая буква названия. */
function CountryAvatar({ iso2, name }: { iso2?: string; name: string }) {
    const src = countryImageSrc(iso2);
    if (src) {
        return (
            <div className={styles.destinationImage}>
                <img src={src} alt="" width={40} height={40} loading="lazy" decoding="async" className={styles.destinationImageImg} />
            </div>
        );
    }
    return (
        <div className={`${styles.destinationImage} ${styles.destinationImageLetter}`} aria-hidden="true">
            {(name || '?').trim().charAt(0).toUpperCase()}
        </div>
    );
}

const WhereFrom = ({ handleChange, value, name, searchType = 'package', fromCity = 'Moscow' }: WhereToProps) => {
    const dispatch = useDispatch<AppDispatch>();
    const inputRef = useRef<HTMLInputElement | null>(null);
    // Поле в окне на весь экран (телефон, до 1024 px)
    const modalInputRef = useRef<HTMLInputElement | null>(null);
    const wrapperRef = useRef<HTMLDivElement>(null);
    const [isOpen, setIsOpen] = useState(false);
    const [searchValue, setSearchValue] = useState("");
    // Until user types after open, show default popular list (not filter by selected text).
    const [hasTyped, setHasTyped] = useState(false);
    const { data } = useSelector((state: RootState) => state.destinations);
    const [browseCountries, setBrowseCountries] = useState<BrowseCountry[]>(DEFAULT_BROWSE_COUNTRIES);

    // Type guard for data structure
    interface DataGroup {
        group_name?: string;
        results?: DestinationItem[];
    }

    const isDataGroup = (item: unknown): item is DataGroup => {
        return typeof item === 'object' && item !== null && 'group_name' in item;
    };

    // Поле, в котором печатает пользователь: на телефоне — в окне на весь экран, иначе — в форме.
    const activeInput = () => {
        const modalInput = modalInputRef.current;
        return modalInput && modalInput.offsetParent !== null ? modalInput : inputRef.current;
    };

    const openDropdown = () => {
        setHasTyped(false);
        setIsOpen(true);
        setTimeout(() => {
            const input = activeInput();
            input?.focus();
            input?.select();
        }, 0);
    };

    // Телефон: окно открылось — курсор (и уже открытая клавиатура) переходит в поле окна.
    useEffect(() => {
        if (!isOpen) return;
        const modalInput = modalInputRef.current;
        if (modalInput && modalInput.offsetParent !== null && document.activeElement !== modalInput) {
            modalInput.focus();
            modalInput.select();
        }
    }, [isOpen]);

    // Live search only after the user types in the open field.
    useEffect(() => {
        if (!isOpen || !hasTyped) return;
        const timeoutId = setTimeout(() => {
            dispatch(
                fetchDestinations({
                    query: searchValue.trim() || ' ',
                    from_city: fromCity,
                    search_type: searchType,
                })
            );
        }, 350);

        return () => clearTimeout(timeoutId);
    }, [searchValue, dispatch, fromCity, searchType, isOpen, hasTyped]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
                setIsOpen(false);
                setHasTyped(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, []);


    const handleToggle = () => {
        if (isOpen) {
            setIsOpen(false);
            setHasTyped(false);
            return;
        }
        openDropdown();
    };

    const handleSelect = (type: string, item: DestinationItem) => {
        const displayName = item.name || item.name_ru || item.name_en || '';
        setSearchValue(displayName);
        setHasTyped(false);
        dispatch(setHeaderName(displayName));
        handleChange(item, name, type);
        setIsOpen(false);
    };

    const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
        setHasTyped(true);
        setSearchValue(e.target.value);
        setIsOpen(true);
    };

    // Keep input in sync when destination is set from parent (URL / header / select)
    useEffect(() => {
        if (value) {
            setSearchValue(value);
            setHasTyped(false);
        }
    }, [value]);

    // По нажатию — сразу список стран (как у Level.Travel): популярные, затем остальные.
    useEffect(() => {
        if (!isOpen) return;
        let cancelled = false;
        loadBrowseCountries(fromCity).then((list) => {
            if (!cancelled && list) setBrowseCountries(list);
        });
        return () => {
            cancelled = true;
        };
    }, [isOpen, fromCity]);

    const ignorName = ['Крым', 'Донецк', 'Луганск', 'Ялта', 'Yalta']

    const isTypingSearch = hasTyped && searchValue.trim().length > 0;
    const browseSplit = splitBrowseCountries(browseCountries);

    // Без ввода — популярные страны из справочника; при вводе — все найденные страны
    // (картинки — свои, countryImageSrc: ссылки Level.Travel на картинки стран битые).
    const getPopularDestinations = (): DestinationItem[] => {
        if (!isTypingSearch) return browseSplit.popular;
        if (!data || !Array.isArray(data)) return [];

        const countriesData = data.find((item: unknown) =>
            isDataGroup(item) && item.group_name === "countries"
        ) as DataGroup | undefined;
        return countriesData?.results || [];
    };

    // Остальные страны — только без ввода (при вводе все совпадения уже в списке выше)
    const getOtherCountries = (): DestinationItem[] => (isTypingSearch ? [] : browseSplit.other);

    // Курорты, мегарегионы и отели — только результаты поиска по введённому тексту
    const searchGroups: unknown[] = isTypingSearch && Array.isArray(data) ? data : [];

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
                    onChange={handleInputChange}
                    onClick={(e) => {
                        e.stopPropagation();
                        openDropdown();
                    }}
                    placeholder="Египет"
                />
            </div>
            <Icon name={'downArrow'} size={24} color="var(--textPrimary)" />
            {isOpen && (
                <div className={styles.whereFromModal} onClick={(e) => e.stopPropagation()}>
                    <div className={styles.whereFromModalHead}>
                        <p>Страна, город, регион или отель</p>
                        <div onClick={() => {
                            setIsOpen(false);
                            setHasTyped(false);
                        }}>
                            <Icon name={'closeLine'} size={24} color="var(--textPrimary)" />
                        </div>
                    </div>
                    <div className={styles.searchFieldInfoM}>
                        <input
                            className={styles.searchFieldsValue}
                            type="text"
                            ref={modalInputRef}
                            value={searchValue}
                            onChange={handleInputChange}
                            onClick={(e) => e.stopPropagation()}
                            placeholder="Страна, курорт или отель"
                            enterKeyHint="search"
                            autoComplete="off"
                        />
                    </div>
                    <div className={styles.searchGroupTyping}>
                        <div className={styles.searchGroupList}>
                            {/* Popular destinations */}
                            {getPopularDestinations().length > 0 && (
                                <>
                                    <p className={styles?.searchGroupListText}>{isTypingSearch ? 'Страны' : 'Популярные страны'}</p>
                                    {getPopularDestinations().map((c, i) => (
                                        <div
                                            key={`popular-${c.iso2 || i}`}
                                            className={styles?.searchGroupListItem}
                                            onClick={() => handleSelect('countries', c)}
                                        >
                                            <CountryAvatar iso2={c.iso2} name={String(c.name || c.name_ru || c.name_en || '')} />
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
                                            <CountryAvatar iso2={c.iso2} name={String(c.name || c.name_ru || c.name_en || '')} />
                                            <div className={styles.destinationInfo}>
                                                <p>{c.name || c.name_ru || c.name_en}</p>
                                                <p>{c.visa_type || ''}</p>
                                            </div>
                                        </div>
                                    ))}
                                </>
                            )}
                            {/* Regions */}
                            {searchGroups
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
                            {searchGroups
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
                            {searchGroups
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
