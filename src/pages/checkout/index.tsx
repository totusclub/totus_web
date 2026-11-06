import Steps from "@/components/searchPage/steps";
import CheckoutScreen from "@/components/checkoutPage";
import withBookingAuth from "@/utils/withBookingAuth";

// Оплата — продолжение бронирования: тоже только для вошедших (см. utils/withBookingAuth.tsx).
function Checkout() {
    return (
        <main className={'searchContainer'}>
            <Steps activeStep="checkout" />
            <CheckoutScreen/>
        </main>
    );
}

export default withBookingAuth(Checkout);
