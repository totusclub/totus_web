// hooks/useDepartureSearch.ts
import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "@/store";
import {fetchDestinations} from "@/store/slices/destinationsSlice";

interface SearchItem {
    id: string;
    name: string;
    icon: string;
    type: string;
    [key: string]: any;
}

export const useDestinationsSearch = (searchValue: string,from_city:string) => {
    const dispatch = useDispatch<AppDispatch>();
    const { data, status, error } = useSelector((state: RootState) => state.destinations);

    const [results, setResults] = useState<SearchItem[]>([]);

    useEffect(() => {
        if (status === "idle") {
            dispatch(fetchDestinations());
            // dispatch(fetchDestinations({query:'""',from_city:from_city,search_type:'package'}));
        }
    }, [dispatch, status]);

    useEffect(() => {
        if (status === "succeeded" && data.countries?.length > 0 && searchValue.trim() !== "") {

            const citiesWithAirports = data.countries.flatMap(countrie => {
                const cityEntry = {
                    ...countrie,
                    name: countrie.name_ru,
                    id: countrie.id,
                    icon: "location",
                    type: "Город",
                };
                const airportEntries = countrie.cities.map(city => ({
                    ...city,
                    name: city.name_ru,
                    icon: "circle",
                    iso2: countrie.iso2,
                    code: countrie.name_en,
                    type: countrie.name_ru,
                }));
                return [cityEntry, ...airportEntries];
            });

            const filtered = citiesWithAirports.filter(item => {
                const lowerSearch = searchValue.toLowerCase();
                return (
                    (item.name && item.name.toLowerCase().includes(lowerSearch)) ||
                    (item.name_ru && item.name_ru.toLowerCase().includes(lowerSearch)) ||
                    (item.name_en && item.name_en.toLowerCase().includes(lowerSearch))
                );
            });

            setResults(filtered);
        } else {
            setResults([]);
        }
    }, [searchValue, data, status]);

    return { results, status, error };
};
