import styles from './search.module.css';
import SearchForm from "@/components/search/searchForm";



const Search = () => {
    return (
        <div className={styles.search}>
            <div className={`content ${styles.searchContent}`}>
                <h1 className={styles.searchTitle}>Путешествия начинаются здесь</h1>
                <SearchForm pageName={'home'} />
            </div>
        </div>
    );
};

export default Search;
