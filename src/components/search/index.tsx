import styles from './search.module.css';
import heroTitleStyles from './heroTitle.module.css';
import SearchForm from "@/components/search/searchForm";
import Icon from "@/components/icons/Icon";
import { useDispatch } from 'react-redux';
import { useEffect, useState } from 'react';
import { clearSearch } from '@/store/slices/searchSlice';
import { getHomeHero, type HomeHero } from '@/api/homeHeroApi';
import { publishHomeHeroTitle } from '@/hooks/useHomeHeroTitle';

const DEFAULT_TITLE = 'Путешествия начинаются здесь';

/**
 * initialHero — hero с сервера (getServerSideProps главной): заголовок и картинка сразу в HTML,
 * картинка предзагружается из <head> (LCP). null — запросить в браузере, как раньше.
 */
const Search = ({ initialHero = null }: { initialHero?: HomeHero | null }) => {
    const dispatch = useDispatch();
    // null — ответ бэкенда ещё не пришёл: заголовок скрыт, чтобы не мелькал текст по умолчанию
    const [heroTitle, setHeroTitle] = useState<string | null>(initialHero ? initialHero.title || DEFAULT_TITLE : null);
    // Только изображение с бэкенда (он случайно выбирает одно из всех hero-изображений админки),
    // и только после полной загрузки — без локальной заглушки
    const [heroImage, setHeroImage] = useState(initialHero?.image || '');

    useEffect(() => {
        dispatch(clearSearch());
    }, [dispatch]);

    useEffect(() => {
        if (initialHero) {
            // Header на Desktop показывает тот же заголовок (см. useHomeHeroTitle)
            publishHomeHeroTitle(initialHero.title || DEFAULT_TITLE);
            return;
        }
        let cancelled = false;
        getHomeHero().then((hero) => {
            if (cancelled) return;
            setHeroTitle(hero.title || DEFAULT_TITLE);
            // На Desktop этот же текст показывает Header (см. useHomeHeroTitle)
            publishHomeHeroTitle(hero.title || DEFAULT_TITLE);
            if (!hero.image) return;
            const img = new window.Image();
            img.onload = () => {
                if (!cancelled) setHeroImage(hero.image);
            };
            img.src = hero.image;
        });
        return () => {
            cancelled = true;
        };
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    return (
        <div
            className={`${styles.search} ${heroTitleStyles.desktopHeight}`}
            style={heroImage ? { backgroundImage: `url(${heroImage})` } : undefined}
        >
            <div className={`content ${styles.searchContent} ${heroTitleStyles.desktopContent}`}>
                <div className={styles.logoHomeM}>
                    <Icon name={"logo"} color={'white'} size={100} />
                </div>
                {/* На Desktop заголовок перенесён в Header, здесь он виден только в мобильной версии */}
                <h1
                    className={`${styles.searchTitle} ${heroTitleStyles.desktopHidden}`}
                    style={heroTitle === null ? { visibility: 'hidden' } : undefined}
                >
                    {heroTitle ?? DEFAULT_TITLE}
                </h1>
                <SearchForm pageName={'home'} />
            </div>
        </div>
    );
};

export default Search;
