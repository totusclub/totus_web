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
    pageName?: string;
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
    page_number:number;
    page_limit:number;
}


const SearchForm = ({ header,pageName}: SearchFormProps) => {
    const dispatch = useDispatch();
    const router = useRouter();
    const [params, setParams] = useState<SearchParams>({
        from_city: 'Moscow',
        from_country: 'RU',
        // to_city: 'Kemer',
        to_country: 'TR',
        adults: '2',
        start_date: '2025-07-21',
        nights: '7..9',
        flex_dates:'2',
        start_date_from: "2025-07-21",
        end_date_till: "2025-08-06",
        // kids: '1',
        // kids_ages: ['8'],
        search_type: 'package',
        page_limit:20,
        page_number:1
        // hotel_ids:[9069464]
    });



    useEffect(()=>{
        const today = new Date();
        const plus7 = new Date();
        plus7.setDate(today.getDate() + 7);
        const dayPlus =  params?.nights?.split('..')?.[0] || params?.nights;
        const interval =  calculateStayDates(plus7,+dayPlus);
        setParams({...params, ...interval});
    },[])

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
        if (router.isReady && pageName === 'search' || pageName === 'home') {
            const parsed = parseSearchParams(router.query);
            if (parsed?.to_city) {
                setParams(prev => ({ ...prev, ...parsed }));
            } else {
                const { to_city, ...restParams } = params;
                const { to_city: _, ...restParsed } = parsed || {};
                setParams({ ...restParams, ...restParsed });
            }
            console.log('parsed',parsed);
            if(Object.keys(parsed).length > 0){
                startSearch(parsed)
            }else{
                const today = new Date();
                const plus7 = new Date();
                plus7.setDate(today.getDate() + 7);
                const dayPlus =  params?.nights?.split('..')?.[0] || params?.nights;
                const interval =  calculateStayDates(plus7,+dayPlus);
                setParams({...params, ...interval});
            }
        }
    }, [router.isReady,pageName]);

    const startSearch = async (data: SearchParams) => {
        dispatch(runFullSearchFlow({
            searchParams: data,
            filterParams: {
                filter_instant_confirm: false,
                page_number: data.page_number,
                page_limit: data.page_limit
            }
        }));
    }

    const handleChange = (value: string | number | number[], key: keyof SearchParams,type:string) => {
        if(key === 'from_city'){
            setParams((prev) => ({
                ...prev,
                from_country:value?.iso2
            }));
        }else if(key === 'to_city'){
            if(type === 'countries'){
                delete params.hotel_ids
                setParams((prev) => ({
                    ...prev,
                    to_country:value?.iso2
                }));
            }
            if(type === 'regions' || type === 'metaregions'){
                delete params.hotel_ids
                setParams((prev) => ({
                    ...prev,
                    to_city: value?.name_en,
                    to_country:value?.iso2
                }));
            }
            if(type === 'hotels'){
                setParams((prev) => ({
                    ...prev,
                    to_city: value?.name_en,
                    to_country:value?.iso2,
                    hotel_ids:[value.id]
                }));
            }
        }else if(key === 'form_date'){
            const dayPlus =  params?.nights?.split('..')?.[0] || params?.nights;
            const interval =  calculateStayDates(value,+dayPlus);
            setParams({...params, ...interval});
        }else if(key === 'nights'){
            const interval =  calculateStayDates(params?.start_date,+value);
            setParams({...params, ...interval,nights:value});
        }else if(key === 'adults'){
            setParams({...params, adults:value});
        }else if(key === 'kids'){
            let age = []
            for(let i=0;i<value;i++){
                age.push('8')
            }
            let kids_ages = []
            for (let i=0;i<value;i++){
                kids_ages.push(9);
            }
            setParams({...params, kids:value,kids_ages:kids_ages});
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

    function formatDateToRussian(dateStr) {
        const russianMonths = [
            'января', 'февраля', 'марта', 'апреля', 'мая', 'июня',
            'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря'
        ];

        const [year, month, day] = dateStr.split('-');
        const monthName = russianMonths[parseInt(month, 10) - 1];

        return `${parseInt(day, 10)} ${monthName}`;
    }

    return (
        <>
            {pageName === 'search' || pageName==='home' && (
                <div className={`${styles.searchForm} ${header && styles.searchFormM}`}>
                    <div className={styles.searchFields}>
                        <WhereTo handleChange={handleChange} name={'to_city'} value={params.to_city}/>
                        <div className={styles.searchGroup}>
                            <SelectDate handleChange={handleChange} name={'form_date'} value={params.start_date}/>
                            <Nights handleChange={handleChange} name={'nights'} value={params.nights}/>
                        </div>
                        <People handleChange={handleChange}
                                value={{adults: params.adults, kids: params.kids, kids_ages: params.kids_ages}}/>
                        <WhereFrom handleChange={handleChange} name={'from_city'} value={params.from_city}/>
                    </div>
                    <Button
                        br={16}
                        icon={'search'}
                        title={header ? '' : 'Найти'}
                        onClick={handleClick}
                    />
                </div>
            )}

            {header && (
                <div className={styles.selectdFormM}>
                    <p>{params?.to_city}</p>
                    <p>{formatDateToRussian(params?.start_date)} , {params?.nights} ночей, {parseInt(params?.adults || 0) + parseInt(params?.kids || 0)} туриста</p>
                </div>
            )}
        </>
    );
};

export default SearchForm;
