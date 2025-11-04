import Steps from "@/components/searchPage/steps";
import BookingCard from "@/components/bookingPage";

export default function Booking() {
    return (
        <main className={'searchContainer'}>
            <Steps active={4}/>
            <BookingCard/>
        </main>
    );
}
