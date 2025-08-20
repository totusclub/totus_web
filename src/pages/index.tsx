import Search from "@/components/search";
import HotDealsSlide from "@/components/home/hotDeals";
import Services from "@/components/home/services";
import {wrapper} from "@/store";
import {increment} from "@/store/slices/counterSlice";
import HomeBanners from "@/components/home/banners";
import Partner from "@/components/home/partner";
import PopularDestinations from "@/components/home/popularDestinations";
import CallRequest from "@/components/home/callRequest";
import Faq from "@/components/home/faq";
import SplashScreen from "@/components/splashScreen";
import {useState} from "react";

export default function Home() {
    const [active, setActive] = useState(true);

    const onFinish =()=>{
        setActive(false)
    }

    return (
        <main>
            <Search/>
            <HomeBanners/>
            <HotDealsSlide title={'Начните планирование путешествия здесь'} slidesToShow={3}/>
            {/*<Services/>*/}
            <PopularDestinations/>
            <Partner/>
            <CallRequest/>
            {/*<Faq/>*/}
            {/*{active && (*/}
            {/*    <SplashScreen onFinish={onFinish}/>*/}
            {/*)}*/}
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
