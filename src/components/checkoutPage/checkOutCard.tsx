import styles from './checkout.module.css';
import { SbpPayButton } from '@/components/UI/SbpPayButton';
import SbpQrModal from '@/components/UI/SbpPayButton/SbpQrModal';
import { useSbpPay } from '@/hooks/useSbpPay';
import { getOrderIdForPay, getOrderPayAmount, getOrderPaymentPurpose } from '@/utils/orderPayment';
import { formatMoneyRub } from '@/utils/packagePrice';

const CheckoutCard = ({ order }) => {
    const { loading, pay, qrModal, closeQrModal } = useSbpPay();
    const amount = getOrderPayAmount(order);
    const orderId = getOrderIdForPay(order);

    const createPaymantLink = async () => {
        if (!orderId || amount <= 0) return;
        await pay({
            orderId,
            amount,
            paymentPurpose: getOrderPaymentPurpose(order),
        });
    };

    return (
        <>
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
                            <p>{formatMoneyRub(amount)}</p>
                        </div>
                        <SbpPayButton
                            fullWidth
                            onClick={createPaymantLink}
                            loading={loading}
                            disabled={loading || amount <= 0}
                        />
                    </div>
                </div>
            </div>
            {qrModal ? (
                <SbpQrModal
                    isOpen={qrModal.isOpen}
                    qrSrc={qrModal.qrSrc}
                    orderId={qrModal.orderId}
                    qrcId={qrModal.qrcId}
                    returnUrl={qrModal.returnUrl}
                    amount={qrModal.amount}
                    onClose={closeQrModal}
                />
            ) : null}
        </>
    );
};

export default CheckoutCard;
