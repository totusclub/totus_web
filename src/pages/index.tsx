import Head from "next/head";
import Search from "@/components/search";
import HotDealsSlide from "@/components/home/hotDeals";
import Services from "@/components/home/services";
import { wrapper } from "@/store";
import { increment } from "@/store/slices/counterSlice";
import HomeBanners from "@/components/home/banners";
import Partner from "@/components/home/partner";
import PopularDestinations from "@/components/home/popularDestinations";
import CallRequest from "@/components/home/callRequest";
import Faq from "@/components/home/faq";
import { useLoadHomeData } from "@/hooks/loadHomeData";
import { loadHomeSsrData, type HomeSsrData } from "@/lib/homeSsr";
import { HERO_DESKTOP_MEDIA, HERO_MOBILE_MEDIA } from "@/api/homeHeroApi";


export default function Home({ homeHero = null, homeData: initialHomeData = null, homeBanners = null, homePartners = null }: Partial<HomeSsrData>) {

    const { homeData } = useLoadHomeData(initialHomeData);

    return (
        <main>
            {homeHero?.image && !homeHero.imageMobile ? (
                <Head>
                    {/* Картинка hero — главный элемент первого экрана (LCP): браузер начинает её
                        загрузку сразу из HTML, не дожидаясь JS и CSS. */}
                    <link rel="preload" as="image" href={homeHero.image} fetchPriority="high" key="home-hero-image" />
                </Head>
            ) : null}
            {homeHero?.image && homeHero.imageMobile && !(homeHero.imageAvif && homeHero.imageMobileAvif) ? (
                <Head>
                    {/* Есть мобильная версия: телефон (до 600 px) грузит только её (~50 КБ),
                        остальные экраны — полную картинку. Те же условия — в search.module.css. */}
                    <link rel="preload" as="image" href={homeHero.imageMobile} media={HERO_MOBILE_MEDIA} fetchPriority="high" key="home-hero-image-mobile" />
                    <link rel="preload" as="image" href={homeHero.image} media={HERO_DESKTOP_MEDIA} fetchPriority="high" key="home-hero-image" />
                </Head>
            ) : null}
            {homeHero?.image && homeHero.imageMobile && homeHero.imageAvif && homeHero.imageMobileAvif ? (
                <Head>
                    {/* Статические hero (src/config/homeHero.ts): предзагружается AVIF — его и покажет
                        CSS (search/heroAvif.module.css). type="image/avif": браузер без AVIF пропускает
                        preload и берёт WebP из CSS. */}
                    <link rel="preload" as="image" type="image/avif" href={homeHero.imageMobileAvif} media={HERO_MOBILE_MEDIA} fetchPriority="high" key="home-hero-image-mobile" />
                    <link rel="preload" as="image" type="image/avif" href={homeHero.imageAvif} media={HERO_DESKTOP_MEDIA} fetchPriority="high" key="home-hero-image" />
                </Head>
            ) : null}
            <Search initialHero={homeHero} />
            <HomeBanners initialBanners={homeBanners} />
            <HotDealsSlide
                title={homeData?.recommendedTitle || 'Начните планирование путешествия здесь'}
                slidesToShow={3}
                recomendHotels={homeData?.recomendHotels}
            />
            {/*<Services />*/}
            <PopularDestinations
                title={homeData?.destinationsTitle || 'Популярные направления'}
                popularDestinations={homeData?.popularDestinations}
            />
            <Partner initialPartners={homePartners} />
            <CallRequest />
            <Faq />

        </main>
    );
}

// SSR: данные первого экрана сразу в HTML (src/lib/homeSsr.ts); при ошибке API — null,
// и компоненты запрашивают данные в браузере, как раньше.
export const getServerSideProps = wrapper.getServerSideProps(
    (store) => async () => {
        // Dispatch Redux action on the server
        store.dispatch(increment()); // <- will increment count before rendering

        const homeSsr = await loadHomeSsrData();

        return {
            props: homeSsr,
        };
    }
);
