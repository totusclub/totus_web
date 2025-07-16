import styles from '../searchPage.module.css';
import Filters from "./filters";
import ResultList from "@/components/searchPage/searchResult/resultList";
import ResultTicketList from "@/components/searchPage/searchResult/searchTicketList";
import {useSelector} from "react-redux";
import {RootState} from "@/store";
import {useMemo} from "react";
import FiltersPackage from "@/components/searchPage/searchResult/filtersPackage";


interface SearchResultProps {
    tickets?:boolean
    flights?:any
    packages?:any
    flightsFilter?:any
    setFiltersRequest?:any
}

const SearchResult = ({tickets,flights,packages,flightsFilter,setFiltersRequest}: SearchResultProps) => {
    const { hotels, loading} = useSelector((state: RootState) => state.search);

    const selectedFilters = useMemo(() => {
        if(!loading){
            return {
                request_id:hotels?.request_id,
                readyOperators:hotels?.readyOperators,
            };
        }
    }, [hotels]);

    return (
        <div className={'content'}>
            <div  className={styles.searchResultWrapper}>

                {tickets ? (
                    <FiltersPackage netPrice={packages?.price} allFilters={flightsFilter} setFiltersRequest={setFiltersRequest}  />
                ):(
                    <Filters statistics={hotels?.statistics} allFilters={hotels?.filters} selectedFilters={selectedFilters} />
                )}

                {tickets?<ResultTicketList packages={packages} flights={flights}/>:<ResultList  data={hotels} loading={loading} tickets={hotels}/>}
            </div>
        </div>
    );
};

export default SearchResult;
