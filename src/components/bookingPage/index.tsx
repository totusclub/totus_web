import styles from './booking.module.css';
import BookingOrderForm from "@/components/bookingPage/bookingForm";
import BookingOrderCard from "@/components/bookingPage/orderCard";




const BookingCard = () => {
    return (
        <div className={'content'}>
            <div className={styles.bookingScreen}>
                <BookingOrderForm/>
                <BookingOrderCard/>
            </div>
        </div>
    );
};

export default BookingCard;
