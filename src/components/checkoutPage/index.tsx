import styles from './checkout.module.css';
import CheckoutCard from "@/components/checkoutPage/checkOutCard";
import CheckoutItems from "@/components/checkoutPage/checkOutItems";
import {useEffect, useState} from "react";
import {useRouter} from "next/router";
import {getOrder} from "@/api/levelTravelApi";




const CheckoutScreen = () => {
    const router = useRouter();
    const [order, setOrder] = useState(null);
    useEffect(() => {
        if(router.query.order_id){
            console.log(router.query.order_id)
            getOrder(router.query.order_id).then(e=>{
                console.log('getOrder',e?.package);
                setOrder(e?.package);
            })
        }

    },[router])
    return (
        <div className={'content'}>
            <div className={`${styles.bookingScreen} ${styles.column}`}>
                <CheckoutItems order={order}/>
                <CheckoutCard order={order}/>
            </div>
        </div>
    );
};

export default CheckoutScreen;
