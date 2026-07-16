import { useCallback, useState } from 'react';
import { createPay } from '@/api/levelTravelApi';
import {
  getSbpQrImageSrc,
  parseSbpPayResponse,
  storeSbpQrcId,
} from '@/utils/sbpPayment';

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

const PAY_RETURN_ORIGIN =
  typeof window !== 'undefined' && window.location?.origin
    ? window.location.origin
    : 'https://totus.club';

function isCreatePayError(payInfo: any): boolean {
  if (!payInfo || typeof payInfo !== 'object') return true;
  if (payInfo.isAxiosError) return true;
  if (payInfo.error) return true;
  if (payInfo.status === 'error') return true;
  return false;
}

export function useSbpPay() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [qrModal, setQrModal] = useState<SbpQrModalState | null>(null);

  const closeQrModal = useCallback(() => {
    setQrModal(null);
  }, []);

  const pay = useCallback(
    async ({ orderId, amount, paymentPurpose, orderName }: SbpPayRequest) => {
      const orderIdStr = String(orderId ?? '').replace(/^ORDER/i, '').trim();
      const payAmount = Number(amount);

      if (!orderIdStr) {
        setError('Не найден номер заказа');
        return;
      }
      if (!Number.isFinite(payAmount) || payAmount <= 0) {
        setError('Некорректная сумма оплаты');
        return;
      }
      if (loading) return;

      setLoading(true);
      setError(null);

      try {
        const expireDate = new Date(Date.now() + 30 * 60 * 1000);
        const returnUrl = `${PAY_RETURN_ORIGIN}/pay?orderId=${orderIdStr}`;
        const payInfo = await createPay({
          orderId: `ORDER${orderIdStr}`,
          orderName: orderName ?? `Заказ №${orderIdStr}`,
          paymentPurpose,
          expire: expireDate.toISOString(),
          amount: {
            value: payAmount,
            code: 'RUB',
          },
          returnUrl,
        });

        if (isCreatePayError(payInfo)) {
          const message =
            payInfo?.error ||
            payInfo?.details ||
            payInfo?.message ||
            payInfo?.response?.data?.error ||
            'Не удалось создать QR-код оплаты';
          setError(String(message));
          return;
        }

        const { payload, qrcId, image } = parseSbpPayResponse(payInfo);
        storeSbpQrcId(orderIdStr, qrcId);

        const qrSrc = getSbpQrImageSrc(payload, image);
        if (qrSrc) {
          // Always show QR when we can generate it (desktop + tablet + mobile web).
          setQrModal({
            isOpen: true,
            qrSrc,
            orderId: orderIdStr,
            qrcId,
            returnUrl,
            amount: payAmount,
          });
          return;
        }

        if (payload) {
          window.location.href = payload;
          return;
        }

        setError('QR-код не получен от банка. Попробуйте ещё раз');
      } catch (err: any) {
        setError(err?.message || 'Ошибка при создании оплаты');
      } finally {
        setLoading(false);
      }
    },
    [loading],
  );

  return {
    loading,
    error,
    pay,
    qrModal,
    closeQrModal,
    clearError: () => setError(null),
  };
}
