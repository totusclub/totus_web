import Steps from "@/components/searchPage/steps";
import CheckoutScreen from "@/components/checkoutPage";

export default function Checkout() {
    return (
        <main className={'searchContainer'}>
            <Steps activeStep="checkout" />
            <CheckoutScreen/>
        </main>
    );
}
