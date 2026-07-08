import styles from './checkout.module.css';
import { SbpPayButton } from '@/components/UI/SbpPayButton';
import SbpQrModal from '@/components/UI/SbpPayButton/SbpQrModal';
import { useSbpPay } from '@/hooks/useSbpPay';

const CheckoutCard = ({ order }) => {
    const { loading, pay, qrModal, closeQrModal } = useSbpPay();

    const createPaymantLink = async () => {
        if (!order?.id) return;
        await pay({
            orderId: order.id,
            amount: order?.full_price,
            paymentPurpose: order?.description_for_client,
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
                            <p>{order?.full_price.toString()?.replace(/\B(?=(\d{3})+(?!\d))/g, '\u202F')} ₽</p>
                        </div>
                        <SbpPayButton
                            fullWidth
                            onClick={createPaymantLink}
                            loading={loading}
                            disabled={loading}
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
