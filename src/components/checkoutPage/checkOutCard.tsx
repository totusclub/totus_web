import styles from './checkout.module.css';
import { useEffect, useRef } from 'react';
import SbpQrPanel from '@/components/UI/SbpPayButton/SbpQrPanel';
import { useSbpPay } from '@/hooks/useSbpPay';
import { getOrderIdForPay, getOrderPayAmount, getOrderPaymentPurpose } from '@/utils/orderPayment';
import { formatMoneyRub } from '@/utils/packagePrice';

const CheckoutCard = ({ order }: { order: any }) => {
    const { loading, error, pay, qr, clearQr, clearError } = useSbpPay();
    const amount = getOrderPayAmount(order);
    const orderId = getOrderIdForPay(order);
    const autoStartedRef = useRef<string | null>(null);

    useEffect(() => {
        if (!orderId || amount <= 0) return;

        const key = `${orderId}:${amount}`;
        if (autoStartedRef.current === key) return;
        autoStartedRef.current = key;

        void pay({
            orderId,
            amount,
            paymentPurpose: getOrderPaymentPurpose(order),
            expireMinutes: 2,
        });
    }, [orderId, amount, order, pay]);

    const handleRetry = () => {
        if (!orderId || amount <= 0 || loading) return;
        clearError();
        clearQr();
        autoStartedRef.current = `${orderId}:${amount}:retry:${Date.now()}`;
        void pay({
            orderId,
            amount,
            paymentPurpose: getOrderPaymentPurpose(order),
            expireMinutes: 2,
        });
    };

    return (
        <div className={styles.checkoutCardWrap}>
            <div className={styles.checkoutCard}>
                <div className={styles.checkoutCardHead}>
                    <p>Способ оплаты</p>
                </div>

                <div className={styles.checkoutCardSlid}>
                    {loading && !qr ? (
                        <div className={styles.sbpQrLoading}>
                            <span className={styles.sbpQrSpinner} aria-hidden />
                            <p>Создаём QR-код для оплаты...</p>
                        </div>
                    ) : null}

                    {error && !qr ? (
                        <div className={styles.sbpQrError}>
                            <p>{error}</p>
                            <button
                                type="button"
                                className={styles.sbpQrRetry}
                                onClick={handleRetry}
                                disabled={loading}
                            >
                                Создать QR снова
                            </button>
                        </div>
                    ) : null}

                    {qr ? (
                        <SbpQrPanel
                            qrSrc={qr.qrSrc}
                            orderId={qr.orderId}
                            qrcId={qr.qrcId}
                            returnUrl={qr.returnUrl}
                            amount={qr.amount}
                            expiresAt={qr.expiresAt}
                            onRetry={handleRetry}
                        />
                    ) : null}
                </div>

                <div className={styles.checkoutCardFooter}>
                    <p>{order?.description_for_client}</p>
                    <div className={styles.checkoutTotalSum}>
                        <p>Итого</p>
                        <p>{formatMoneyRub(amount)}</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CheckoutCard;
