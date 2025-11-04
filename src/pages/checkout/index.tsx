import Steps from "@/components/searchPage/steps";
import CheckoutScreen from "@/components/checkoutPage";

export default function Checkout() {
    return (
        <main className={'searchContainer'}>
            <Steps active={5}/>
            <CheckoutScreen/>
        </main>
    );
}
