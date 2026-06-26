import { useState } from 'react';
import styles from './checkout.module.css';
import { SbpPayButton } from '@/components/UI/SbpPayButton';
import { createPay } from "@/api/levelTravelApi";





const CheckoutCard = ({ order }) => {
    const [payLoading, setPayLoading] = useState(false);

    const createPaymantLink = async () => {
        if (payLoading) return;
        setPayLoading(true);
        try {
            const expireDate = new Date(Date.now() + 20 * 60 * 1000);
            const returnUrl = `https://totus.club/pay?orderId=${order.id}`;
            const payInfo = await createPay({
                orderId: `ORDER${order.id}`,
                orderName: `Заказ №${order.id}`,
                paymentPurpose: order?.description_for_client,
                expire: expireDate,
                amount: {
                    value: order?.full_price,
                    code: "RUB"
                },
                returnUrl,
            });
            const sbpUrl =
                payInfo?.data?.payload ||
                payInfo?.payload ||
                payInfo?.payUrl ||
                payInfo?.object?.payUrl;
            const qrcId = payInfo?.data?.qrcId || payInfo?.qrcId;
            if (qrcId && typeof window !== "undefined") {
                sessionStorage.setItem(`sbp_qrc_${order.id}`, qrcId);
            }
            if (sbpUrl) {
                window.location.href = sbpUrl;
            }
        } finally {
            setPayLoading(false);
        }
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
                    <SbpPayButton
                        fullWidth
                        onClick={createPaymantLink}
                        loading={payLoading}
                        disabled={payLoading}
                    />
                </div>
            </div>
        </div>
    );
};

export default CheckoutCard;
