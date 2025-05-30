import styles from './search.module.css';
import Button from "@/components/UI/button";
import People from "@/components/search/people";
import Nights from "@/components/search/nights";
import WhereTo from "@/components/search/whereTo";
import WhereFrom from "@/components/search/whereFrom";
import SelectDate from "@/components/search/date";
import {router} from "next/client";

interface SearchFormProps {
    header:boolean;
}

const SearchForm = ({header}: SearchFormProps) => {
    const handleClick = () => {
        router.push('/search'); // Navigate to /about
    };
    return (
        <div className={styles.searchForm}>
            <div className={styles.searchFields}>
                <WhereFrom/>
                <WhereTo/>
                <SelectDate/>
                <Nights/>
                <People/>
            </div>
            <Button br={16} icon={'search'} title={header?'':'Найти'} onClick={handleClick}/>
        </div>
    );
};

export default SearchForm;
