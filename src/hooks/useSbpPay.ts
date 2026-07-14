import { useCallback, useState } from 'react';
import { createPay } from '@/api/levelTravelApi';
import {
  getSbpQrImageSrc,
  parseSbpPayResponse,
  storeSbpQrcId,
} from '@/utils/sbpPayment';
import { useIsDesktop } from '@/hooks/useIsDesktop';

export type SbpPayRequest = {
  orderId: string | number;
  amount: number;
  paymentPurpose?: string;
  orderName?: string;
};

export type SbpQrModalState = {
  isOpen: boolean;
  qrSrc: string;
  orderId: string;
  qrcId: string | null;
  returnUrl: string;
  amount?: number;
};

const PAY_RETURN_ORIGIN = 'https://totus.club';

export function useSbpPay() {
  const isDesktop = useIsDesktop();
  const [loading, setLoading] = useState(false);
  const [qrModal, setQrModal] = useState<SbpQrModalState | null>(null);

  const closeQrModal = useCallback(() => {
    setQrModal(null);
  }, []);

  const pay = useCallback(
    async ({ orderId, amount, paymentPurpose, orderName }: SbpPayRequest) => {
      const orderIdStr = String(orderId);
      if (!orderIdStr || loading) return;

      setLoading(true);
      try {
        const expireDate = new Date(Date.now() + 30 * 60 * 1000);
        const returnUrl = `${PAY_RETURN_ORIGIN}/pay?orderId=${orderIdStr}`;
        const payInfo = await createPay({
          orderId: `ORDER${orderIdStr}`,
          orderName: orderName ?? `Заказ №${orderIdStr}`,
          paymentPurpose,
          expire: expireDate,
          amount: {
            value: amount,
            code: 'RUB',
          },
          returnUrl,
        });

        const { payload, qrcId, image } = parseSbpPayResponse(payInfo);
        storeSbpQrcId(orderIdStr, qrcId);

        if (isDesktop) {
          const qrSrc = getSbpQrImageSrc(payload, image);
          if (qrSrc) {
            setQrModal({
              isOpen: true,
              qrSrc,
              orderId: orderIdStr,
              qrcId,
              returnUrl,
              amount,
            });
            return;
          }
        }

        if (payload) {
          window.location.href = payload;
        }
      } finally {
        setLoading(false);
      }
    },
    [isDesktop, loading],
  );

  return {
    loading,
    pay,
    qrModal,
    closeQrModal,
    isDesktop,
  };
}
