import { useEffect, useMemo, useState } from 'react';
import { checkPay } from '@/api/levelTravelApi';
import { isSbpPaymentPaid } from '@/utils/sbpPayment';
import { formatPriceRub } from '@/utils/formatPrice';
import SbpLogo from './SbpLogo';
import styles from './sbpQrPanel.module.css';

type Props = {
  qrSrc: string;
  orderId: string;
  qrcId: string | null;
  returnUrl: string;
  amount?: number;
  expiresAt: number;
  onRetry?: () => void;
};

function formatRemaining(ms: number): string {
  const totalSec = Math.max(0, Math.ceil(ms / 1000));
  const minutes = Math.floor(totalSec / 60);
  const seconds = totalSec % 60;
  return `${minutes}:${String(seconds).padStart(2, '0')}`;
}

const SbpQrPanel = ({
  qrSrc,
  orderId,
  qrcId,
  returnUrl,
  amount,
  expiresAt,
  onRetry,
}: Props) => {
  const [checking, setChecking] = useState(false);
  const [now, setNow] = useState(() => Date.now());
  const remainingMs = expiresAt - now;
  const expired = remainingMs <= 0;

  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, []);

  useEffect(() => {
    if (!orderId || expired) return;

    let cancelled = false;

    const pollPayment = async () => {
      setChecking(true);
      try {
        const result = await checkPay({
          orderId,
          ...(qrcId ? { qrcId } : {}),
        });

        if (!cancelled && isSbpPaymentPaid(result)) {
          window.location.href = returnUrl;
        }
      } finally {
        if (!cancelled) {
          setChecking(false);
        }
      }
    };

    void pollPayment();
    const intervalId = window.setInterval(pollPayment, 3000);

    return () => {
      cancelled = true;
      window.clearInterval(intervalId);
    };
  }, [orderId, qrcId, returnUrl, expired]);

  const statusText = useMemo(() => {
    if (expired) return 'Время оплаты истекло';
    if (checking) return 'Проверяем статус оплаты...';
    return 'Ожидаем оплату';
  }, [expired, checking]);

  return (
    <div className={styles.panel} aria-live="polite">
      <div className={styles.urgency}>
        <p className={styles.urgencyTitle}>
          Успейте оплатить тур за 2 минуты!
        </p>
        <p className={styles.urgencyText}>
          Цены на билеты и отели растут — сохраните текущую стоимость прямо сейчас!
        </p>
      </div>

      <div className={styles.header}>
        <SbpLogo size={24} />
        <p>Оплата по СБП</p>
      </div>

      {typeof amount === 'number' && amount > 0 ? (
        <p className={styles.amount}>{formatPriceRub(amount)}</p>
      ) : null}

      <p className={styles.hint}>
        Отсканируйте QR-код в приложении банка, чтобы оплатить заказ
      </p>

      <div className={`${styles.qrWrap} ${expired ? styles.qrExpired : ''}`}>
        <img className={styles.qrImage} src={qrSrc} alt="QR-код для оплаты по СБП" />
      </div>

      <p className={styles.timer}>
        {expired
          ? 'QR-код больше не действует'
          : `Оплатите в течение ${formatRemaining(remainingMs)}`}
      </p>
      <p className={styles.status}>{statusText}</p>
      {expired && onRetry ? (
        <button type="button" className={styles.retryBtn} onClick={onRetry}>
          Создать новый QR-код
        </button>
      ) : null}
    </div>
  );
};

export default SbpQrPanel;
