import styles from './search.module.css';
import SearchForm from "@/components/search/searchForm";
import Icon from "@/components/icons/Icon";
import { useDispatch } from 'react-redux';
import { useEffect, useState } from 'react';
import { clearSearch } from '@/store/slices/searchSlice';
import { getHomeHero } from '@/api/homeHeroApi';
import coverImage from '@/assets/images/cover.webp';

const DEFAULT_TITLE = 'Путешествия начинаются здесь';

const Search = () => {
    const dispatch = useDispatch();
    const [heroTitle, setHeroTitle] = useState(DEFAULT_TITLE);
    const [heroImage, setHeroImage] = useState('');

    useEffect(() => {
        dispatch(clearSearch());
    }, [dispatch]);

    useEffect(() => {
        getHomeHero().then((hero) => {
            setHeroTitle(hero.title || DEFAULT_TITLE);
            setHeroImage(hero.image || '');
        });
    }, []);

    return (
        <div
            className={styles.search}
            style={{
                backgroundImage: `url(${heroImage || coverImage.src})`,
            }}
        >
            <div className={`content ${styles.searchContent}`}>
                <div className={styles.logoHomeM}>
                    <Icon name={"logo"} color={'white'} size={100} />
                </div>
                <h1 className={styles.searchTitle}>{heroTitle}</h1>
                <SearchForm pageName={'home'} />
            </div>
        </div>
    );
};

export default Search;
