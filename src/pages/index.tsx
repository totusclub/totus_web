// pages/index.tsx
// import { useSelector } from 'react-redux';
// import { RootState, wrapper } from '../store';
// import { increment } from '../store/slices/counterSlice';
import Search from "@/components/search";
import HotDealsSlide from "@/components/home/hotDeals";
import Services from "@/components/home/services";
import TourRecomend from "@/components/home/tourRecomend";
import {wrapper} from "@/store";
import {increment} from "@/store/slices/counterSlice";


export default function Home() {
    // const count = useSelector((state: RootState) => state.counter.value);

    return (
        <main>
            <Search/>
            <HotDealsSlide title={'Горячие предложения отелей'} slidesToShow={3}/>
            <Services/>
            <HotDealsSlide title={'Начните планирование путешествия здесь'} slidesToShow={4}/>
            <TourRecomend title={'Путешественники рекомендуют Арлекинотур'} slidesToShow={3}/>
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
