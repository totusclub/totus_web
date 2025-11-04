import styles from './search.module.css';
import SearchForm from "@/components/search/searchForm";
import Icon from "@/components/icons/Icon";



const Search = () => {
    return (
        <div className={styles.search}>
            <div className={`content ${styles.searchContent}`}>
                <div className={styles.logoHomeM}>
                    <Icon name={"logo"} color={'white'} size={100} />
                </div>
                <h1 className={styles.searchTitle}>Путешествия начинаются здесь</h1>
                <SearchForm pageName={'home'} />
            </div>
        </div>
    );
};

export default Search;
