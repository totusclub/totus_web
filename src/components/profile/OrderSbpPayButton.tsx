import { useState } from 'react';
import { SbpPayButton } from '@/components/UI/SbpPayButton';
import { createPay } from '@/api/levelTravelApi';
import {
  canPayWithSbp,
  getOrderIdForPay,
  getOrderPayAmount,
  isOrderAwaitingPayment,
} from '@/utils/orderPayment';
import styles from './profile.module.css';

type Props = {
  order: any;
  fullWidth?: boolean;
};

const OrderSbpPayButton = ({ order, fullWidth = true }: Props) => {
  const [loading, setLoading] = useState(false);

  if (!order || !isOrderAwaitingPayment(order) || !canPayWithSbp(order)) {
    return null;
  }

  const orderId = getOrderIdForPay(order);
  const amount = getOrderPayAmount(order);

  const handlePay = async () => {
    if (!orderId || loading) return;
    setLoading(true);
    try {
      const expireDate = new Date(Date.now() + 20 * 60 * 1000);
      const returnUrl = `https://totus.club/pay?orderId=${orderId}`;
      const payInfo = await createPay({
        orderId: `ORDER${orderId}`,
        orderName: `Заказ №${orderId}`,
        expire: expireDate,
        amount: {
          value: amount,
          code: 'RUB',
        },
        returnUrl,
      });

      const sbpUrl =
        payInfo?.data?.payload ||
        payInfo?.payload ||
        payInfo?.payUrl ||
        payInfo?.object?.payUrl;
      const qrcId = payInfo?.data?.qrcId || payInfo?.qrcId;
      if (qrcId && typeof window !== 'undefined') {
        sessionStorage.setItem(`sbp_qrc_${orderId}`, qrcId);
      }
      if (sbpUrl) {
        window.location.href = sbpUrl;
      }
    } finally {
      setLoading(false);
    }
  };

  return (
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
  );
};

export default OrderSbpPayButton;
