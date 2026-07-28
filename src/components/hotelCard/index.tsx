import styles from './hotelCard.module.css';
import Icon from "@/components/icons/Icon";
import Button from "@/components/UI/button";
import { useRouter } from "next/router";
import { useMemo } from "react";
import { useTheme } from "@/hooks/useTheme";
import { useSelector } from "react-redux";
import type { RootState } from "@/store";
import {
    buildListRoomPickFromHotelItem,
    extractMealFromHotelItem,
    listRoomPickToQueryParams,
    resolveActiveSearchMealCodes,
} from "@/utils/listRoomPick";
import { markSearchListForRestore, pickAppliedFiltersFromHotels, readSearchListState, replaceSearchListFilters } from "@/utils/searchListState";

interface HotelCardState {
    item: any
    request_id?: string,
    lazy?: boolean
}


const HotelCard = ({ item, lazy }: HotelCardState) => {
    const router = useRouter();
    const { theme, mounted } = useTheme();
    const hotelsState = useSelector((state: RootState) => state.search.hotels);

    // Use safe default during SSR to prevent hydration mismatch
    const iconColor = mounted ? (theme === 'dark' ? '#fff' : '#000') : '#000';

    const { hotel, analytics_min_price, min_price_nights, dates } = item ?? {};

    const searchType = (router.query.search_type as string) || 'package';
    const activeFilterMeals = useMemo(() => {
        const fromHotels = hotelsState?.filter_meals;
        const fromQuery = router.query.filter_meals;
        const raw = fromHotels ?? (Array.isArray(fromQuery) ? fromQuery[0] : fromQuery);
        const rawStr = raw != null && String(raw).trim() !== '' ? String(raw) : null;

        // Resolve listing ids/names → room codes (RO, BB, AI…). Never invent AI here —
        // that overwrote the user's meal filter on hotel details.
        const codes = resolveActiveSearchMealCodes({
            filterMeals: rawStr,
            listingMealOptions: hotelsState?.filters?.meals ?? null,
            searchType,
            defaultPackageMeals: null,
        });
        if (codes.length) return codes.join(',');
        return rawStr || undefined;
    }, [hotelsState?.filter_meals, hotelsState?.filters?.meals, router.query.filter_meals, searchType]);

    const activeFilterOperators = useMemo(() => {
        const fromHotels =
            hotelsState?.filter_operators ??
            hotelsState?.operators ??
            hotelsState?.filters?.operators
                ?.filter((op: { selected?: boolean }) => op?.selected)
                ?.map((op: { id?: string | number }) => op.id)
                ?.filter((id: unknown) => id != null)
                ?.join(',');
        const fromQuery =
            router.query.filter_operators ??
            router.query.operators;
        const raw = fromHotels ?? (Array.isArray(fromQuery) ? fromQuery[0] : fromQuery);
        if (raw == null || raw === '') return undefined;
        return String(raw)
            .split(',')
            .map((part) => part.trim())
            .filter(Boolean)
            .join(',');
    }, [
        hotelsState?.filter_operators,
        hotelsState?.operators,
        hotelsState?.filters?.operators,
        router.query.filter_operators,
        router.query.operators,
    ]);

    const listRoomPick = useMemo(
        () =>
            buildListRoomPickFromHotelItem(item as unknown as Record<string, unknown>, {
                filterMeals: activeFilterMeals,
                filterOperators: activeFilterOperators,
                startDate: (router.query.start_date as string) || undefined,
            }),
        [item, activeFilterMeals, activeFilterOperators, router.query.start_date],
    );

    const handleClick = () => {
        sessionStorage.setItem("searchScroll", window.scrollY.toString());
        markSearchListForRestore();

        // Snapshot every currently applied listing filter before leaving the results page.
        const snapshot = {
            ...readSearchListState()?.filters,
            ...pickAppliedFiltersFromHotels(hotelsState),
            ...(activeFilterMeals ? { filter_meals: activeFilterMeals } : {}),
            ...(activeFilterOperators ? { filter_operators: activeFilterOperators } : {}),
        };
        replaceSearchListFilters(
            snapshot,
            hotelsState?.request_id ? String(hotelsState.request_id) : undefined,
        );

        const dateFromCard =
            dates && typeof dates === "object" ? Object.keys(dates)[0] : undefined;
        // Prefer search nights from URL — card min_price_nights can be a different
        // duration and hide most rooms on hotel details.
        const nightsFromSearch =
            (router.query.nights as string) ||
            (min_price_nights != null && Number.isFinite(Number(min_price_nights))
                ? String(min_price_nights)
                : '7');
        const listPrice =
            analytics_min_price != null && Number.isFinite(Number(analytics_min_price))
                ? String(Math.round(Number(analytics_min_price)))
                : undefined;

        // Get all search params from current URL query
        const queryParams: Record<string, string | string[]> = {
            hotel_id: String(item?.hotel?.id),
            from_city: (router.query.from_city as string) || 'Moscow',
            from_country: (router.query.from_country as string) || 'RU',
            to_country: (router.query.to_country as string) || '',
            to_city: (router.query.to_city as string) || '',
            adults: (router.query.adults as string) || '2',
            start_date:
                (router.query.start_date as string) ||
                dateFromCard ||
                '',
            nights: nightsFromSearch,
            search_type: searchType,
            // flex_dates: (router.query.flex_dates as string) ?? '2', // ±2 dates disabled
            flex_dates: (router.query.flex_dates as string) ?? '0',
            ...listRoomPickToQueryParams(listRoomPick),
        };

        // Always pin the card price so hotel details can match it.
        if (listPrice) {
            queryParams.list_price = listPrice;
        }

        // filter_meals = full search selection (can be AI,UAI).
        // meal_id = concrete item meal when known; otherwise same as search filter.
        const itemMeal = extractMealFromHotelItem(item as unknown as Record<string, unknown>);
        if (activeFilterMeals) {
            queryParams.filter_meals = activeFilterMeals;
            if (typeof window !== 'undefined') {
                sessionStorage.setItem('hotelDetailsFilterMeals', activeFilterMeals);
            }
        } else if (typeof window !== 'undefined') {
            sessionStorage.removeItem('hotelDetailsFilterMeals');
        }
        if (itemMeal.mealId) {
            // Keep full search meals in filter_meals; item meal is only for offer matching.
            queryParams.meal_id = String(itemMeal.mealId);
            if (itemMeal.mealType && !String(activeFilterMeals || '').includes(',')) {
                queryParams.meal_type = itemMeal.mealType;
            } else {
                delete queryParams.meal_type;
            }
        } else if (activeFilterMeals) {
            queryParams.meal_id = activeFilterMeals;
            delete queryParams.meal_type;
        }
        // Do not reuse the listing request_id — it only has partial hotel inventory
        // (often one room). Hotel details must start a hotel-scoped search.
        if (activeFilterOperators) {
            queryParams.filter_operators = activeFilterOperators;
            queryParams.operator_id = activeFilterOperators;
        }

        if (router.query.start_date_from) {
            queryParams.start_date_from = router.query.start_date_from as string;
        }
        if (router.query.end_date_till) {
            queryParams.end_date_till = router.query.end_date_till as string;
        }

        // Add optional params if they exist
        if (router.query.kids) {
            queryParams.kids = router.query.kids as string;
        }
        if (router.query.kids_ages) {
            queryParams.kids_ages = Array.isArray(router.query.kids_ages)
                ? router.query.kids_ages
                : [router.query.kids_ages as string];
        }
        if (hotel?.reviews_count) {
            queryParams.reviews_count = String(hotel.reviews_count);
        }
        if (hotel?.rating) {
            queryParams.rating = String(hotel.rating);
        }

        router.push({
            pathname: '/hotel-details',
            query: queryParams,
        }, undefined, { shallow: false });
    };


    const formattedDate = useMemo(() => {
        if (dates) {
            const dateKey = Object.keys(dates)[0];
            const date = new Date(dateKey);
            return date.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' });
        }
    }, [dates]);


    const formatHotelInfoToRussian = (data: Record<string, any>) => {
        const labels: Record<string, string> = {
            construction_year: 'Год постройки',
            renovation_year: 'Год реновации',
            airport_distance: 'до аэропорта',
            beach_distance: 'до пляжа',
            distance_to_city_center: 'до центра города',
            beach_size: 'Размер пляжа',
            beach_type: 'Тип пляжа',
            beach_surface: 'Покрытие пляжа',
            area: 'Площадь территории',
            line: 'Береговая линия',
            wi_fi: 'Wi-Fi',
            ski_lift_distance: 'до подъемника',
            ski_in: 'Выход на склон (ski-in)',
            ski_out: 'Выход со склона (ski-out)',
            fitness: 'Фитнес',
            aquapark: 'Аквапарк',
            nanny: 'Няня',
            kids_menu: 'Детское меню',
            kids_club: 'Детский клуб',
            kids_pool: 'Детский бассейн',
            pool: 'Бассейн',
            heated_pool: 'Подогреваемый бассейн',
            aircon: 'Кондиционер',
            parking: 'Парковка',
            massage: 'Массаж',
            thermal_fun: 'Термальные процедуры',
            bar: 'Бар',
            indoor_pool: 'Крытый бассейн',
            no_single_men: 'Без одиноких мужчин',
            min_age: 'Минимальный возраст',
        };

        const ignoredKeys = ['construction_year', 'renovation_year', 'area', 'beach_type', 'beach_size', 'no_single_men', 'thermal_fun'];

        return Object.entries(data)
            .filter(([key, value]) => value !== null && value !== false && !ignoredKeys.includes(key))
            .map(([key, value]) => {
                const label = labels[key] || key;

                // Handle distance fields: convert to km
                if (['airport_distance', 'beach_distance', 'ski_lift_distance'].includes(key)) {
                    if (value < 1000) {
                        return `${value} м ${label}`;
                    } else {
                        const km = Math.round(value / 1000);
                        return `${km} км ${label}`;
                    }
                }

                // Already in km (e.g. 7.8) or meters (>= 1000)
                if (key === 'distance_to_city_center') {
                    const num = Number(value);
                    if (!Number.isFinite(num) || num <= 0) return null;
                    if (num >= 1000) {
                        return `${Math.round(num / 1000)} км ${label}`;
                    }
                    const km = Number.isInteger(num) ? num : Math.round(num * 10) / 10;
                    return `${km} км ${label}`;
                }

                if (typeof value === 'string' && value === 'FREE') {
                    return `бесплатно ${label}`;
                }
                if (typeof value === 'string' && value === 'PAID') {
                    return `платный ${label}`;
                }
                if (typeof value === 'string' && value === 'LOBBY_FREE') {
                    return `Бесплатный ${label} в лобби`;
                }
                if (typeof value === 'string' && value === 'LOBBY_PAID') {
                    return `платный ${label} в лобби`;
                }
                if (typeof value === 'string' && value === 'LOBBY_UNKNOWN') {
                    return `${label} в лобби`;
                }

                if (typeof value === 'boolean') {
                    return label;
                }

                const units: Record<string, string> = {
                    area: 'м²',
                };

                if (key === 'line') {
                    return `${value}-я линия`;
                }
                if (key === 'beach_surface') {
                    const raw = String(value).trim().toUpperCase().replace(/\s+/g, '');
                    const beachSurfaceMap: Record<string, string> = {
                        SAND: 'Песок',
                        PEBBLE: 'Галька',
                        'SAND+PEBBLE': 'Песок с галькой',
                        SAND_PEBBLE: 'Песок с галькой',
                        PLATFORM: 'Платформа',
                        CONCRETE: 'Бетон',
                        CORAL: 'Коралл',
                        ROCKS: 'Скалы',
                    };
                    return beachSurfaceMap[raw] || String(value);
                }

                return `${value}${units[key] || ''} ${label}`;
            })
            .filter((tag): tag is string => Boolean(tag));
    };


    const TAGS = useMemo(() => {
        if (hotel?.features) {
            return formatHotelInfoToRussian(hotel.features);
        } else {
            return [];
        }
    }, [hotel?.features]);


    const showImage = useMemo(() => {
        if (hotel?.images?.length > 0) {
            let path = hotel.images[0]?.webp_x620 || hotel.images[0].x500 || "";
            return path
        }
        return "";
    }, [hotel]);

    if (!lazy) {
        return (
            <div className={styles.hotelCard}>
                {/*<div className={styles.hotelCardImage} style={{backgroundImage: `url(https://image.totus.club/imagePath?directory=${showImage})`}}/>*/}
                <div
                    className={styles.hotelCardImage}
                    style={{ backgroundImage: `url(${showImage})` }}
                    onClick={handleClick}
                    role="link"
                    tabIndex={0}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            handleClick();
                        }
                    }}
                />

                <div className={styles.hotelCardInfo}>
                    <div className={styles.hotelCardHead}>
                        <div className={styles.hotelStart}>
                            <Icon name={'star'} size={18}
                                color={hotel?.stars >= 1 ? 'var(--core_Orange)' : 'var(--bgSecondary)'} />
                            <Icon name={'star'} size={18}
                                color={hotel?.stars >= 2 ? 'var(--core_Orange)' : 'var(--bgSecondary)'} />
                            <Icon name={'star'} size={18}
                                color={hotel?.stars >= 3 ? 'var(--core_Orange)' : 'var(--bgSecondary)'} />
                            <Icon name={'star'} size={18}
                                color={hotel?.stars >= 4 ? 'var(--core_Orange)' : 'var(--bgSecondary)'} />
                            <Icon name={'star'} size={18}
                                color={hotel?.stars >= 5 ? 'var(--core_Orange)' : 'var(--bgSecondary)'} />
                        </div>
                        <div className={styles.hotelCardName}>
                            <p>{hotel?.name}</p>
                        </div>
                        <div className={styles.hotelCardImageInfoM}>
                            <p><Icon name={'message'} size={14}
                                color={iconColor} /> {hotel?.reviews_count > 0 ? `${hotel?.reviews_count} отзывов` : 'нет отзывов'}
                            </p>
                            {hotel?.rating > 0 && (
                                <p>{hotel.rating}</p>
                            )}
                        </div>

                    </div>
                    <div className={styles.hotelCardTags}>
                        {TAGS?.map(tag => (
                            <div className={styles.hotelCardTagItem} key={tag}>
                                <p>{tag}</p>
                            </div>
                        ))}
                    </div>
                    <div className={styles.hotelCardPriceM}>
                        <p>от {analytics_min_price?.toString()?.replace(/\B(?=(\d{3})+(?!\d))/g, '\u202F')}₽</p>
                        <p>от {formattedDate}, на {min_price_nights} ночей</p>
                        <Button onClick={handleClick} full={true} title={'Выбрать'} />
                    </div>

                </div>
                <div className={styles.hotelCardPrice}>
                    <div className={styles.hotelCardImageInfo}>
                        <p><Icon name={'message'} size={14} color={iconColor} /> {hotel?.reviews_count > 0 ? `${hotel?.reviews_count} отзывов` : 'нет отзывов'}</p>
                        {hotel?.rating > 0 && (
                            <p>{hotel.rating}</p>
                        )}
                    </div>
                    <div className={styles.hotelCardCheckout}>
                        <p>от {analytics_min_price?.toString()?.replace(/\B(?=(\d{3})+(?!\d))/g, '\u202F')}₽</p>
                        <Button onClick={handleClick} full={true} title={'Выбрать'} />
                        <div className={styles.hotelCardDate}>
                            <p>c {formattedDate}, на {min_price_nights} ночей</p>
                        </div>
                    </div>
                </div>
            </div>
        );
    } else {
        return (
            <div className={styles.hotelCard}>
                {/* Image Section - 212px × 152px */}
                <div className={styles.image_placeholder}></div>

                {/* Info Section - flex: 1 */}
                <div className={styles.hotelCardInfo}>
                    {/* Header Section */}
                    <div className={styles.hotelCardHead}>
                        {/* Star Rating */}
                        <div className={styles.hotelStart}>
                            <Icon name={'star'} size={18} color={'var(--bgSecondary)'} />
                            <Icon name={'star'} size={18} color={'var(--bgSecondary)'} />
                            <Icon name={'star'} size={18} color={'var(--bgSecondary)'} />
                            <Icon name={'star'} size={18} color={'var(--bgSecondary)'} />
                            <Icon name={'star'} size={18} color={'var(--bgSecondary)'} />
                        </div>
                        {/* Hotel Name */}
                        <div className={styles.hotelCardName}>
                            <div className={styles.animationTextlazy} style={{ width: '85%', height: '24px' }}></div>
                        </div>
                        {/* Mobile Reviews Info */}
                        <div className={styles.hotelCardImageInfoM}>
                            <div className={styles.animationTextlazy} style={{ width: '120px', height: '12px' }}></div>
                            <div className={styles.animationTextlazy} style={{ width: '35px', height: '12px' }}></div>
                        </div>
                    </div>

                    {/* Tags Section */}
                    <div className={styles.hotelCardTags}>
                        <div className={styles.hotelCardTagItem}>
                            <div className={styles.animationTaglazy} style={{ width: '70px', height: '16px' }}></div>
                        </div>
                        <div className={styles.hotelCardTagItem}>
                            <div className={styles.animationTaglazy} style={{ width: '95px', height: '16px' }}></div>
                        </div>
                        <div className={styles.hotelCardTagItem}>
                            <div className={styles.animationTaglazy} style={{ width: '80px', height: '16px' }}></div>
                        </div>
                        <div className={styles.hotelCardTagItem}>
                            <div className={styles.animationTaglazy} style={{ width: '60px', height: '16px' }}></div>
                        </div>
                    </div>

                    {/* Mobile Price Section */}
                    <div className={styles.hotelCardPriceM}>
                        <div className={styles.animationTextlazy} style={{ width: '100px', height: '20px' }}></div>
                        <div className={styles.animationTextlazy} style={{ width: '140px', height: '14px' }}></div>
                    </div>
                </div>

                {/* Desktop Price Section */}
                <div className={styles.hotelCardPrice}>
                    {/* Desktop Reviews Info */}
                    <div className={styles.hotelCardImageInfo}>
                        <div className={styles.animationTextlazy} style={{ width: '100px', height: '12px' }}></div>
                        <div className={styles.animationTextlazy} style={{ width: '35px', height: '18px' }}></div>
                    </div>

                    {/* Checkout Section */}
                    <div className={styles.hotelCardCheckout}>
                        {/* Price */}
                        <div className={styles.animationTextlazy} style={{ width: '120px', height: '24px' }}></div>
                        {/* Button */}
                        <div className={styles.animationButtonLazy}></div>
                        {/* Date */}
                        <div className={styles.hotelCardDate}>
                            <div className={styles.animationTextlazy} style={{ width: '150px', height: '14px' }}></div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }
};

export default HotelCard;
