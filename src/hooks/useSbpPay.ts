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
  /** QR lifetime in minutes (default 2). */
  expireMinutes?: number;
};

export type SbpQrState = {
  qrSrc: string;
  orderId: string;
  qrcId: string | null;
  returnUrl: string;
  amount?: number;
  expiresAt: number;
};

const PAY_RETURN_ORIGIN =
  typeof window !== 'undefined' && window.location?.origin
    ? window.location.origin
    : 'https://totus.club';

const DEFAULT_EXPIRE_MINUTES = 2;

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
  const [qr, setQr] = useState<SbpQrState | null>(null);

  const clearQr = useCallback(() => {
    setQr(null);
  }, []);

  const pay = useCallback(
    async ({
      orderId,
      amount,
      paymentPurpose,
      orderName,
      expireMinutes = DEFAULT_EXPIRE_MINUTES,
    }: SbpPayRequest) => {
      const orderIdStr = String(orderId ?? '').replace(/^ORDER/i, '').trim();
      const payAmount = Number(amount);
      const lifetimeMs = Math.max(1, expireMinutes) * 60 * 1000;

      if (!orderIdStr) {
        setError('Не найден номер заказа');
        return null;
      }
      if (!Number.isFinite(payAmount) || payAmount <= 0) {
        setError('Некорректная сумма оплаты');
        return null;
      }
      if (loading) return null;

      setLoading(true);
      setError(null);

      try {
        const expiresAt = Date.now() + lifetimeMs;
        const expireDate = new Date(expiresAt);
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
          return null;
        }

        const { payload, qrcId, image } = parseSbpPayResponse(payInfo);
        storeSbpQrcId(orderIdStr, qrcId);

        const qrSrc = getSbpQrImageSrc(payload, image);
        if (qrSrc) {
          const next: SbpQrState = {
            qrSrc,
            orderId: orderIdStr,
            qrcId,
            returnUrl,
            amount: payAmount,
            expiresAt,
          };
          setQr(next);
          return next;
        }

        if (payload) {
          window.location.href = payload;
          return null;
        }

        setError('QR-код не получен от банка. Попробуйте ещё раз');
        return null;
      } catch (err: any) {
        setError(err?.message || 'Ошибка при создании оплаты');
        return null;
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
    qr,
    clearQr,
    clearError: () => setError(null),
    /** @deprecated use `qr` — kept for older modal callers */
    qrModal: qr
      ? {
          isOpen: true,
          qrSrc: qr.qrSrc,
          orderId: qr.orderId,
          qrcId: qr.qrcId,
          returnUrl: qr.returnUrl,
          amount: qr.amount,
        }
      : null,
    closeQrModal: clearQr,
  };
}
