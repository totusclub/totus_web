import React, { useMemo, useCallback } from "react";
import Slider from "react-slick";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
import styles from './home.module.css'
import Icon from "@/components/icons/Icon";
import { useRouter } from "next/router";
import { useDispatch } from "react-redux";
import { runFullSearchFlow, setHeaderName } from "@/store/slices/searchSlice";
import { AppDispatch } from "@/store";

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
    const startDate = new Date(startDateStr);
    const endDate = new Date(startDate);
    endDate.setDate(startDate.getDate() + nightCount);
    const formatDate = (date: Date) => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };

    return {
        start_date_from: formatDate(startDate),
        end_date_till: formatDate(endDate)
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

export default function PopularDestinations({ popularDestinations }: { popularDestinations?: DestinationItem[] | null }) {
    const router = useRouter();
    const dispatch = useDispatch<AppDispatch>();
    const date = useMemo(() => {
        return getDefaultStartDate();
    }, []);

    const handlePressHotel = useCallback(
        (item: DestinationItem) => {
            if (!item) {
                return;
            }

            // Calculate date range (similar to searchForm)
            // Parse nights from "7..9" format or use default
            const nightsValue = "7..9";
            const nightCount = parseInt(nightsValue.split('..')[0] || "7", 10);
            const dateRange = calculateStayDates(date, nightCount);

            // Build params object matching SearchParams interface (same as searchForm)
            const params = {
                from_city: "Moscow",
                from_country: "RU",
                to_country: item?.iso2 || item?.to_country || "",
                to_city: "", // Empty string, not undefined
                adults: "1",
                kids: "0", // Default to "0" if not provided
                kids_ages: [] as number[], // Empty array
                start_date: date,
                nights: nightsValue, // "7..9" format
                flex_dates: "2",
                start_date_from: dateRange.start_date_from,
                end_date_till: dateRange.end_date_till,
                search_type: "package",
                page_number: 1,
                page_limit: 20,
                sort_by: "relevance"
                // hotel_ids is optional, not included for country search
            };

            // Build search params for Redux action (convert to proper types)
            const searchParams = {
                from_city: params.from_city,
                from_country: params.from_country,
                to_country: params.to_country,
                to_city: params.to_city || undefined,
                adults: params.adults,
                kids: params.kids,
                kids_ages: params.kids_ages,
                start_date: params.start_date,
                nights: params.nights,
                search_type: params.search_type,
                flex_dates: Number(params.flex_dates),
                page_number: params.page_number,
                page_limit: params.page_limit,
                sort_by: params.sort_by
            };

            const filterParams = {
                filter_instant_confirm: false,
                page_number: 1,
                page_limit: 20,
                sort_by: "relevance",
                filter_stars: "3,4,5",
                filter_meals: "AI"
            };

            // Set header name with destination name
            const destinationName = item?.name || item?.name_ru || item?.name_en || '';
            dispatch(setHeaderName(destinationName));

            // Dispatch search flow
            dispatch(
                runFullSearchFlow({
                    searchParams,
                    filterParams,
                })
            );

            // Create URL with query params and navigate (like searchForm)
            // Use the same params object for URL (createSearchUrl handles arrays and encoding)
            const url = createSearchUrl(params);
            setTimeout(() => {
                router.push(`/search?${url}`);
            }, 500);
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
            <p className={styles.hotProductTitle}>Популярные направления</p>

            <div className={styles.recomendDeslist}>
                {popularDestinations?.map((item, index) => {
                    const destinationName = item?.name || item?.name_ru || item?.name_en || '';
                    const destinationImage = item?.image || '';

                    return (
                        <div
                            key={item?.id || index}
                            onClick={() => handlePressHotel(item)}
                            className={styles.recomendDeslistItem}
                            style={{
                                backgroundImage: `url(${destinationImage})`,
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

            <div className={styles.recomendDeslistMob}>
                <Slider {...settings}>
                    {popularDestinations?.map((item, index) => {
                        return (
                            <div   key={item?.id || index}>
                            <div  style={{
                                    backgroundImage: `url(${item?.image})`,
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
