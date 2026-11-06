import Steps from "@/components/searchPage/steps";
import BookingCard from "@/components/bookingPage";
import withBookingAuth from "@/utils/withBookingAuth";

// Бронирование только для вошедших: гостю открывается окно входа/регистрации, URL с параметрами тура сохраняется.
function Booking() {
    return (
        <main className={'searchContainer'}>
            <Steps activeStep="booking" />
            <BookingCard/>
        </main>
    );
}

export default withBookingAuth(Booking);
