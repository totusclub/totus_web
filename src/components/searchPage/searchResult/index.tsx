import styles from '../searchPage.module.css';
import Filters from "./filters";
import ResultList from "@/components/searchPage/searchResult/resultList";
import ResultTicketList from "@/components/searchPage/searchResult/searchTicketList";
import { useSelector } from "react-redux";
import { RootState } from "@/store";
import { useMemo } from "react";
import FiltersPackage from "@/components/searchPage/searchResult/filtersPackage";
import { toOperatorIdsCsv } from "@/utils/searchResults";

interface SearchResultProps {
    tickets?: any
    flights?: any
    packages?: any
    flightsFilter?: any
    setFiltersRequest?: any
    loading?: boolean
}

const SearchResult = ({ tickets, flights, packages, flightsFilter, setFiltersRequest, loading: ticketsLoading }: SearchResultProps) => {
    const { hotels, loading } = useSelector((state: RootState) => state.search);

    const selectedFilters = useMemo(() => {
        if (hotels?.request_id) {
            const operators = toOperatorIdsCsv(hotels?.readyOperators);
            return {
                request_id: hotels.request_id,
                ...(operators ? { readyOperators: operators } : {}),
            };
        }
        return null;
    }, [hotels?.request_id, hotels?.readyOperators]);

    return (
        <div className={'content'}>

            <div className={styles.searchResultWrapper}>

                {tickets ? (
                    <FiltersPackage netPrice={packages?.price} allFilters={flightsFilter} setFiltersRequest={setFiltersRequest} />
                ) : (
                    <Filters statistics={hotels?.statistics} allFilters={hotels?.filters} selectedFilters={selectedFilters} />
                )}

                {tickets ? <ResultTicketList packages={packages} flights={flights} loading={ticketsLoading || false} /> : <ResultList data={hotels} loading={loading} setFiltersRequest={setFiltersRequest} />}
            </div>
        </div>
    );
};

export default SearchResult;
