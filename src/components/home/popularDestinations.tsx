import React, { useMemo, useCallback } from "react";
import Slider from "react-slick";
import "slick-carousel/slick/slick.css";
import styles from './home.module.css'
import Icon from "@/components/icons/Icon";
import { useRouter } from "next/router";
import { useDispatch } from "react-redux";
import { runFullSearchFlow, setHeaderName, setStartSearch } from "@/store/slices/searchSlice";
import { AppDispatch } from "@/store";
import { stayRangeFromDeparture } from "@/utils/calendarDateRange";
import { replaceSearchListFilters, writeSearchListState } from "@/utils/searchListState";
import { useNearViewport } from "@/hooks/useNearViewport";

// Helper function to get default start date (7 days from today)
const getDefaultStartDate = (): string => {
    const today = new Date();
    const plus7 = new Date();
    plus7.setDate(today.getDate() + 7);
    const year = plus7.getFullYear();
    const month = String(plus7.getMonth() + 1).padStart(2, '0');
    const day = String(plus7.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

// Helper function to calculate stay dates (similar to searchForm)
const calculateStayDates = (startDateStr: string, nightCount: number) => {
    const range = stayRangeFromDeparture(startDateStr, nightCount);
    return {
        start_date_from: range.start_date_from,
        end_date_till: range.end_date_till,
    };
};

// Helper function to create search URL from params (similar to searchForm)
const createSearchUrl = (params: Record<string, string | number | number[] | undefined>): string => {
    const queryParams: string[] = [];

    Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
            if (Array.isArray(value)) {
                value.forEach((val) => {
                    queryParams.push(`${encodeURIComponent(key)}=${encodeURIComponent(val)}`);
                });
            } else {
                queryParams.push(`${encodeURIComponent(key)}=${encodeURIComponent(value)}`);
            }
        }
    });

    return queryParams.join('&');
};

interface DestinationItem {
    id?: string | number;
    name?: string;
    name_ru?: string;
    name_en?: string;
    iso2?: string;
    to_country?: string;
    image?: string;
    [key: string]: string | number | boolean | undefined;
}

export default function PopularDestinations({
    title = 'Популярные направления',
    popularDestinations,
}: {
    title?: string;
    popularDestinations?: DestinationItem[] | null;
}) {
    const router = useRouter();
    const dispatch = useDispatch<AppDispatch>();
    // Фото направлений — ниже первого экрана: грузим, когда блок рядом с экраном (PageSpeed)
    const [desktopListRef, desktopListVisible] = useNearViewport<HTMLDivElement>();
    const [mobileListRef, mobileListVisible] = useNearViewport<HTMLDivElement>();
    const date = useMemo(() => {
        return getDefaultStartDate();
    }, []);

    const handlePressHotel = useCallback(
        (item: DestinationItem) => {
            if (!item) {
                return;
            }

            const toCountry = String(item?.iso2 || item?.to_country || '').trim();
            if (!toCountry) {
                return;
            }

            const nightsValue = "7";
            const nightCount = parseInt(nightsValue, 10);
            const dateRange = calculateStayDates(date, nightCount);

            const params = {
                from_city: "Moscow",
                from_country: "RU",
                to_country: toCountry,
                adults: "2",
                kids: "0",
                start_date: date,
                start_date_from: dateRange.start_date_from,
                end_date_till: dateRange.end_date_till,
                nights: nightsValue,
                search_type: "package",
                page_number: 1,
                page_limit: 50,
                sort_by: "relevance",
            };

            const searchParams = {
                from_city: params.from_city,
                from_country: params.from_country,
                to_country: params.to_country,
                adults: params.adults,
                kids: params.kids,
                start_date: params.start_date,
                start_date_from: params.start_date_from,
                end_date_till: params.end_date_till,
                nights: params.nights,
                search_type: params.search_type,
            };

            const filterParams = {
                filter_instant_confirm: false,
                page_number: 1,
                page_limit: 50,
                sort_by: "relevance",
                filter_stars: "3,4,5",
            };

            // Fresh destination search — do not carry previous meal filters (e.g. AI).
            replaceSearchListFilters({
                filter_instant_confirm: false,
                filter_stars: "3,4,5",
                sort_by: "relevance",
            });
            // Same key shape as searchForm getAutoSearchKey (no page_limit/sort_by)
            // so /search does not cancel this in-flight request.
            writeSearchListState({
                autoSearchKey: JSON.stringify(searchParams),
                requestId: null,
            });

            if (typeof window !== 'undefined') {
                sessionStorage.removeItem('hotelDetailsFilterMeals');
            }

            const destinationName = item?.name || item?.name_ru || item?.name_en || '';
            dispatch(setHeaderName(destinationName));
            dispatch(setStartSearch(false));
            dispatch(
                runFullSearchFlow({
                    searchParams: {
                        ...searchParams,
                        page_number: 1,
                        page_limit: 50,
                        sort_by: "relevance",
                    },
                    filterParams,
                })
            );

            const url = createSearchUrl({
                ...params,
                page_number: 1,
                page_limit: 50,
                sort_by: "relevance",
            });
            router.push(`/search?${url}`);
        },
        [router, date, dispatch]
    );
    const settings = {
        dots: true,
        infinite: true,
        speed: 500,
        slidesToShow: 1,
        slidesToScroll: 1,
        initialSlide: 0,
        responsive: [

            {
                breakpoint: 600,
                settings: {
                    slidesToShow: 2,
                    slidesToScroll: 2,
                    initialSlide: 2
                }
            },
            {
                breakpoint: 480,
                settings: {
                    slidesToShow: 1.2,
                    slidesToScroll: 1,
                    dots: false,
                    arrows: false
                }
            },
            {
                breakpoint: 1026,
                settings: {
                    slidesToShow: 2.3,
                    slidesToScroll: 2,
                    infinite: false,
                    dots: false
                }
            },

        ]
    };

    return (
        <div className={styles.popularDestinationsWrapper}>
            <p className={styles.hotProductTitle}>{title}</p>

            <div className={styles.recomendDeslist} ref={desktopListRef}>
                {popularDestinations?.map((item, index) => {
                    const destinationName = item?.name || item?.name_ru || item?.name_en || '';
                    const destinationImage = item?.image || '';

                    return (
                        <div
                            key={item?.id || index}
                            onClick={() => handlePressHotel(item)}
                            className={styles.recomendDeslistItem}
                            style={{
                                backgroundImage: desktopListVisible && destinationImage ? `url(${destinationImage})` : undefined,
                                cursor: 'pointer'
                            }}
                        >
                            <div className={styles.recomendDeslistItemInfo}>
                                <p className={styles.recomendDeslistItemInfoText}>
                                    {destinationName} <Icon name={'next'} />
                                </p>
                            </div>
                        </div>
                    );
                })}
            </div>

            <div className={styles.recomendDeslistMob} ref={mobileListRef}>
                <Slider {...settings}>
                    {popularDestinations?.map((item, index) => {
                        return (
                            <div   key={item?.id || index}>
                            <div  style={{
                                    backgroundImage: mobileListVisible && item?.image ? `url(${item.image})` : undefined,
                                    cursor: 'pointer'

                                }}
                                onClick={() => handlePressHotel(item)}
                                className={styles.recomendDeslistItem}

                            >

                                <div className={styles.recomendDeslistItemInfo}>
                                    <p className={styles.recomendDeslistItemInfoText}>
                                        {item?.name} <Icon name={'next'} />
                                    </p>
                                </div>
                            </div>
                            </div>
                        );
                    })}
                </Slider>
            </div>
        </div>
    );
}
