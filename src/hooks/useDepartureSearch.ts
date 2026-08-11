// hooks/useDepartureSearch.ts
import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "@/store";
import { fetchDepartures } from "@/store/slices/departuresSlice";

interface SearchItem {
    id: string;
    name: string;
    icon: string;
    type: string;
    [key: string]: any;
}

export const useDepartureSearch = (searchValue: string) => {
    const dispatch = useDispatch<AppDispatch>();
    const { data, status, error } = useSelector((state: RootState) => state.departures);

    const [results, setResults] = useState<SearchItem[]>([]);

    useEffect(() => {
        if (status === "idle") {
            dispatch(fetchDepartures());
        }
    }, [dispatch, status]);

    useEffect(() => {
        if (status === "succeeded" && data.departures.length > 0) {
            const citiesWithAirports = data.departures.flatMap(city => {
                const cityEntry = {
                    ...city,
                    name: city.name_ru,
                    id: `city-${city.id}`,
                    icon: "location",
                    type: "Город",
                };
                const airportEntries = city.airports.map(airport => ({
                    ...airport,
                    icon: "plane",
                    type: "Аэропорт",
                }));
                // return [cityEntry, ...airportEntries];
                return [cityEntry];
            });

            const filtered = citiesWithAirports.filter(item => {
                const lowerSearch = searchValue.toLowerCase();
                return (
                    (item.name && item.name.toLowerCase().includes(lowerSearch)) ||
                    (item.name_ru && item.name_ru.toLowerCase().includes(lowerSearch)) ||
                    (item.name_en && item.name_en.toLowerCase().includes(lowerSearch))
                );
            });

            // Popular (prioritized) cities first, then the rest of the full list.
            const sorted = [...filtered].sort((a, b) => {
                const ap = a.prioritized ? 0 : 1;
                const bp = b.prioritized ? 0 : 1;
                if (ap !== bp) return ap - bp;
                return String(a.name || '').localeCompare(String(b.name || ''), 'ru');
            });

            setResults(sorted);
        } else {
            setResults([]);
        }
    }, [searchValue, data, status]);

    return { results, status, error };
};
