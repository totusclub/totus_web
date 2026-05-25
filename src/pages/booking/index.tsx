import Steps from "@/components/searchPage/steps";
import BookingCard from "@/components/bookingPage";

export default function Booking() {
    return (
        <main className={'searchContainer'}>
            <Steps activeStep="booking" />
            <BookingCard/>
        </main>
    );
}
