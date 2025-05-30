import styles from '../searchPage.module.css';
import Filters from "./filters";
import ResultList from "@/components/searchPage/searchResult/resultList";
import ResultTicketList from "@/components/searchPage/searchResult/searchTicketList";


interface SearchResultProps {
    tickets?:boolean
}

const SearchResult = ({tickets}: SearchResultProps) => {
    return (
        <div className={'content'}>
            <div className={styles.searchResultWrapper}>
                <Filters/>
                {tickets?<ResultTicketList/>:<ResultList tickets={tickets}/>}
            </div>
        </div>
    );
};

export default SearchResult;
