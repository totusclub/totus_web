import styles from './search.module.css';
import heroTitleStyles from './heroTitle.module.css';
import SearchForm from "@/components/search/searchForm";
import Icon from "@/components/icons/Icon";
import { useDispatch } from 'react-redux';
import { useEffect, useState, type CSSProperties } from 'react';
import { clearSearch } from '@/store/slices/searchSlice';
import { getHomeHero, HERO_MOBILE_MEDIA, type HomeHero } from '@/api/homeHeroApi';
import { publishHomeHeroTitle } from '@/hooks/useHomeHeroTitle';

const DEFAULT_TITLE = 'Путешествия начинаются здесь';

/**
 * Фон hero. Есть мобильная версия — обе картинки в CSS-переменных, а какую показать, решает
 * search.module.css (.searchHeroMobile): до 600 px — мобильную, шире — полную. Браузер качает
 * только показанную. Нет мобильной — полная картинка в style, как раньше.
 */
function heroBackground(image: string, imageMobile: string): CSSProperties | undefined {
    if (!image) return undefined;
    if (!imageMobile) return { backgroundImage: `url(${image})` };
    return {
        ['--hero-desktop' as string]: `url(${image})`,
        ['--hero-mobile' as string]: `url(${imageMobile})`,
    } as CSSProperties;
}

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
    const [heroImageMobile, setHeroImageMobile] = useState(initialHero?.image ? initialHero.imageMobile || '' : '');

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
            const mobile = hero.imageMobile || '';
            // заранее грузим ту версию, которую покажет этот экран
            const useMobile = Boolean(mobile) && window.matchMedia?.(HERO_MOBILE_MEDIA).matches;
            const img = new window.Image();
            img.onload = () => {
                if (cancelled) return;
                setHeroImageMobile(mobile);
                setHeroImage(hero.image);
            };
            img.src = useMobile ? mobile : hero.image;
        });
        return () => {
            cancelled = true;
        };
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    return (
        <div
            className={`${styles.search} ${heroTitleStyles.desktopHeight}${heroImage && heroImageMobile ? ` ${styles.searchHeroMobile}` : ''}`}
            style={heroBackground(heroImage, heroImageMobile)}
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
