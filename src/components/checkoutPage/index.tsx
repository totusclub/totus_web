import styles from './checkout.module.css';
import CheckoutCard from "@/components/checkoutPage/checkOutCard";
import CheckoutItems from "@/components/checkoutPage/checkOutItems";




const CheckoutScreen = () => {
    return (
        <div className={'content'}>
            <div className={styles.bookingScreen}>
                <CheckoutItems/>
                <CheckoutCard/>
            </div>
        </div>
    );
};

export default CheckoutScreen;
