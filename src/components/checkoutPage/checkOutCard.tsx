import styles from './checkout.module.css';
import Button from "@/components/UI/button";





const CheckoutCard = () => {
    return (
        <div className={styles.checkoutCardWrap}>
            <div className={styles.checkoutCard}>
                <div className={styles.checkoutCardHead}>
                    <p>Способ оплаты</p>
                </div>
                <div className={styles.checkoutCardSlid}>

                </div>
                <div className={styles.checkoutCardFooter}>
                    <p>Тур в отель Amwaj Beach Club Abu Soma (Ex. Amwaj Blue Beach Resort & Spa - Abu Soma), 4*</p>
                    <div className={styles.checkoutTotalSum}>
                        <p>Итого</p>
                        <p>120 593 ₽</p>
                    </div>
                    <Button full={true} title={'Перейти к оплате'}/>

                </div>
            </div>
        </div>
    );
};

export default CheckoutCard;
