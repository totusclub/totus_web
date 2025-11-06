import styles from './checkout.module.css';
import Button from "@/components/UI/button";
import {createPay} from "@/api/levelTravelApi";





const CheckoutCard = ({order}) => {


    const createPaymantLink = async ()=>{
        const expireDate = new Date(Date.now() + 20 * 60 * 1000);
        const payInfo = await createPay({
            orderId: `ORDER${order.id}`,
            orderName: `Заказ №1${order.id}`,
            expire: expireDate,
            amount: {
                value: order?.full_price,
                code: "RUB"
            },
            returnUrl :"https://totus.club/pay"
        })
        // console.log('payInfo',payInfo)
        if (payInfo?.object?.payUrl) {
            // console.log('Redirecting to payment:', payInfo);
            window.location.href = payInfo?.object?.payUrl;
        }
        // window.location.href = payInfo.payUrl;
    }
    return (
        <div className={styles.checkoutCardWrap}>
            <div className={styles.checkoutCard}>
                <div className={styles.checkoutCardHead}>
                    <p>Способ оплаты</p>
                </div>
                <div className={styles.checkoutCardSlid}>

                </div>
                <div className={styles.checkoutCardFooter}>
                    <p>{order?.description_for_client}</p>
                    <div className={styles.checkoutTotalSum}>
                        <p>Итого</p>
                        <p>{order?.full_price.toString()?.replace(/\B(?=(\d{3})+(?!\d))/g, '\u202F')} ₽</p>
                    </div>
                    <Button full={true} onClick={()=>createPaymantLink()} title={'Перейти к оплате'}/>
                </div>
            </div>
        </div>
    );
};

export default CheckoutCard;
