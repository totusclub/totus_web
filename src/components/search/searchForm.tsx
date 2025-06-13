import styles from './search.module.css';
import Button from "@/components/UI/button";
import People from "@/components/search/people";
import Nights from "@/components/search/nights";
import WhereTo from "@/components/search/whereTo";
import WhereFrom from "@/components/search/whereFrom";
import SelectDate from "@/components/search/date";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import {useDispatch} from "react-redux";
import {runFullSearchFlow} from "@/store/slices/searchSlice";

interface SearchFormProps {
    header?: boolean;
}

interface SearchParams {
    from_city: string;
    to_country: string;
    adults: string;
    start_date: string;
    nights: string;
    flex_dates: string;
    start_date_from: string;
    start_date_till: string;
    end_date_from: string;
    end_date_till: string;
    from_country: string;
    to_city: string;
    kids: string;
    kids_ages: number[];
    search_type: string;
    hotel_ids: number[];
}


const SearchForm = ({ header }: SearchFormProps) => {
    const dispatch = useDispatch();
    const router = useRouter();
    const [params, setParams] = useState<SearchParams>({
        from_city: 'Moscow',
        from_country: 'RU',
        to_city: 'Kemer',
        to_country: 'TR',
        adults: '2',
        start_date: '2025-07-21',
        nights: '7..9',
        flex_dates:'2',
        start_date_from: "2025-07-21",
        end_date_till: "2025-08-06",
        // kids: '2',
        // kids_ages: [8, 11],
        search_type: 'package',
    });


    function calculateStayDates(startDateStr, nightCount) {
        const startDate = new Date(startDateStr);
        const endDate = new Date(startDate);
        endDate.setDate(startDate?.getDate() + nightCount);

        const formatDate = (date) => {
            const year = date.getFullYear();
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const day = String(date.getDate()).padStart(2, '0');
            return `${year}-${month}-${day}`;
        };

        return {
            start_date: formatDate(startDate),
            start_date_from: formatDate(startDate),
            end_date_till:formatDate(endDate)
        };
    }




    useEffect(() => {
        if (router.isReady) {
            const parsed = parseSearchParams(router.query);
            setParams({ ...params, ...parsed });
            if(Object.keys(parsed).length > 0){
                startSearch(parsed)
                console.log('router.isReady1',router.isReady)
            }else{
                const today = new Date();
                const plus7 = new Date();
                plus7.setDate(today.getDate() + 7);
                const dayPlus =  params?.nights?.split('..')?.[0] || params?.nights;
                console.log('dayPlus',dayPlus)

                const interval =  calculateStayDates(plus7,+dayPlus);
                console.log('interval',interval)
                setParams({...params, ...interval});
            }

        }
    }, [router.isReady]);

    const startSearch = async (data) => {
        dispatch(runFullSearchFlow({
            searchParams: data,
            filterParams: { filter_instant_confirm: false }
        }));
    }

    const handleChange = (value: string | number | number[], key: keyof SearchParams) => {
        if(key === 'from_city'){
            setParams((prev) => ({
                ...prev,
                from_city: value?.name_en,
                from_country:value?.iso2
            }));
        }else if(key === 'to_city'){
            setParams((prev) => ({
                ...prev,
                to_city: value?.name_en,
                to_country:value?.iso2
            }));
        }else if(key === 'form_date'){
            const dayPlus =  params?.nights?.split('..')?.[0] || params?.nights;
            console.log('dayPlus',dayPlus,value)

            const interval =  calculateStayDates(value,+dayPlus);
            console.log('interval',interval)
            setParams({...params, ...interval});
        }else if(key === 'nights'){
            const interval =  calculateStayDates(params?.start_date,+value);
            console.log('interval',interval)
            setParams({...params, ...interval,nights:value});
        }

    };

    const handleClick = () => {
        const url = createSearchUrl(params);
        startSearch(params)
        router.push(`/search?${url}`);
    };

    const createSearchUrl = (params: SearchParams): string => {
        const queryParams: string[] = [];

        Object.entries(params).forEach(([key, value]) => {
            if (Array.isArray(value)) {
                value.forEach((val) => {
                    queryParams.push(`${encodeURIComponent(key)}=${encodeURIComponent(val)}`);
                });
            } else {
                queryParams.push(`${encodeURIComponent(key)}=${encodeURIComponent(value)}`);
            }
        });

        return queryParams.join('&');
    };

    const parseSearchParams = (query: Record<string, string | string[]>): Partial<SearchParams> => {
        const parsed: Partial<SearchParams> = {};

        for (const key in query) {
            const value = query[key];

            // Fields that are expected to be arrays
            if (key === 'kids_ages' || key === 'hotel_ids') {
                const arrayValues = Array.isArray(value) ? value : [value];
                parsed[key as keyof SearchParams] = arrayValues.map(Number);
            } else {
                // Everything else is a string
                parsed[key as keyof SearchParams] = Array.isArray(value) ? value[0] : value;
            }
        }

        return parsed;
    };

    return (
        <div className={styles.searchForm}>
            <div className={styles.searchFields}>
                <WhereFrom handleChange={handleChange} name={'from_city'} value={params.from_city} />
                <WhereTo handleChange={handleChange} name={'to_city'} value={params.to_city} />
                <SelectDate handleChange={handleChange} name={'form_date'} value={params.start_date} />
                <Nights handleChange={handleChange} name={'nights'} value={params.nights} />
                <People handleChange={handleChange} value={{ adults: params.adults, kids: params.kids, kids_ages: params.kids_ages }} />
            </div>
            <Button
                br={16}
                icon={'search'}
                title={header ? '' : 'Найти'}
                onClick={handleClick}
            />
        </div>
    );
};

export default SearchForm;
