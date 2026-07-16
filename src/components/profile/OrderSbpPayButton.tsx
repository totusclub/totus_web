import { SbpPayButton } from '@/components/UI/SbpPayButton';
import SbpQrModal from '@/components/UI/SbpPayButton/SbpQrModal';
import type { MouseEvent } from 'react';
import {
  canPayWithSbp,
  getOrderIdForPay,
  getOrderPayAmount,
  getOrderPaymentPurpose,
  isOrderAwaitingPayment,
} from '@/utils/orderPayment';
import { useSbpPay } from '@/hooks/useSbpPay';
import styles from './profile.module.css';

type Props = {
  order: any;
  fullWidth?: boolean;
};

const OrderSbpPayButton = ({ order, fullWidth = true }: Props) => {
  const { loading, error, pay, qrModal, closeQrModal, clearError } = useSbpPay();

  if (!order || !isOrderAwaitingPayment(order) || !canPayWithSbp(order)) {
    return null;
  }

  const orderId = getOrderIdForPay(order);
  const amount = getOrderPayAmount(order);
  const canPay = Boolean(orderId) && amount > 0;

  const handlePay = (e?: MouseEvent) => {
    e?.preventDefault();
    e?.stopPropagation();
    clearError();
    if (!orderId || amount <= 0) return;
    pay({
      orderId,
      amount,
      paymentPurpose: getOrderPaymentPurpose(order),
      orderName: `Заказ №${orderId}`,
    });
  };

  return (
    <>
      <div
        className={styles.orderItemPayWrap}
        onClick={(e) => e.stopPropagation()}
        onMouseDown={(e) => e.stopPropagation()}
      >
        <SbpPayButton
          fullWidth={fullWidth}
          onClick={handlePay}
          loading={loading}
          disabled={loading || !canPay}
        />
        {error ? <p className={styles.orderPayError}>{error}</p> : null}
        {!canPay ? (
          <p className={styles.orderPayError}>Не удалось определить сумму оплаты</p>
        ) : null}
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

export default OrderSbpPayButton;
