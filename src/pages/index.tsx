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


export default function Home() {

    const { homeData } = useLoadHomeData();
    console.log('homeData', homeData);

    return (
        <main>
            <Search />
            <HomeBanners />
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
            <Partner />
            <CallRequest />
            <Faq />

        </main>
    );
}

// SSR function
export const getServerSideProps = wrapper.getServerSideProps(
    (store) => async () => {
        // Dispatch Redux action on the server
        store.dispatch(increment()); // <- will increment count before rendering

        return {
            props: {}, // props can remain empty, Redux handles state
        };
    }
);
