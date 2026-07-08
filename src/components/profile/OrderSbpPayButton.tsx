import { SbpPayButton } from '@/components/UI/SbpPayButton';
import SbpQrModal from '@/components/UI/SbpPayButton/SbpQrModal';
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
  const { loading, pay, qrModal, closeQrModal } = useSbpPay();

  if (!order || !isOrderAwaitingPayment(order) || !canPayWithSbp(order)) {
    return null;
  }

  const orderId = getOrderIdForPay(order);
  const amount = getOrderPayAmount(order);

  const handlePay = () => {
    if (!orderId) return;
    pay({
      orderId,
      amount,
      paymentPurpose: getOrderPaymentPurpose(order),
    });
  };

  return (
    <>
      <div
        className={styles.orderItemPayWrap}
        onClick={(e) => e.stopPropagation()}
      >
        <SbpPayButton
          fullWidth={fullWidth}
          onClick={handlePay}
          loading={loading}
          disabled={loading}
        />
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
