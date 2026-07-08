import { useEffect, useState } from 'react';
import Modal from 'react-modal';
import { checkPay } from '@/api/levelTravelApi';
import { isSbpPaymentPaid } from '@/utils/sbpPayment';
import { formatPriceRub } from '@/utils/formatPrice';
import SbpLogo from './SbpLogo';
import styles from './sbpQrModal.module.css';
import Icon from '@/components/icons/Icon';

type Props = {
  isOpen: boolean;
  qrSrc: string;
  orderId: string;
  qrcId: string | null;
  returnUrl: string;
  amount?: number;
  onClose: () => void;
};

const SbpQrModal = ({
  isOpen,
  qrSrc,
  orderId,
  qrcId,
  returnUrl,
  amount,
  onClose,
}: Props) => {
  const [checking, setChecking] = useState(false);

  useEffect(() => {
    if (typeof document !== 'undefined') {
      Modal.setAppElement('#root');
    }
  }, []);

  useEffect(() => {
    if (!isOpen || !orderId) return;

    let cancelled = false;

    const pollPayment = async () => {
      setChecking(true);
      try {
        const result = await checkPay({
          orderId,
          ...(qrcId ? { qrcId } : {}),
        } as never);

        if (!cancelled && isSbpPaymentPaid(result)) {
          window.location.href = returnUrl;
        }
      } finally {
        if (!cancelled) {
          setChecking(false);
        }
      }
    };

    pollPayment();
    const intervalId = window.setInterval(pollPayment, 3000);

    return () => {
      cancelled = true;
      window.clearInterval(intervalId);
    };
  }, [isOpen, orderId, qrcId, returnUrl]);

  return (
    <Modal
      isOpen={isOpen}
      onRequestClose={onClose}
      overlayClassName={styles.overlay}
      className={styles.modal}
      contentLabel="Оплата по СБП"
    >
      <div className={styles.header}>
        <div className={styles.headerTitle}>
          <SbpLogo size={24} />
          <p>Оплата по СБП</p>
        </div>
        <button type="button" className={styles.closeBtn} onClick={onClose} aria-label="Закрыть">
          <Icon name="closeLine" />
        </button>
      </div>

      <div className={styles.body}>
        {typeof amount === 'number' && amount > 0 ? (
          <p className={styles.amount}>{formatPriceRub(amount)}</p>
        ) : null}
        <p className={styles.hint}>
          Отсканируйте QR-код в приложении банка, чтобы оплатить заказ
        </p>
        <div className={styles.qrWrap}>
          <img className={styles.qrImage} src={qrSrc} alt="QR-код для оплаты по СБП" />
        </div>
        <p className={styles.status}>
          {checking ? 'Проверяем статус оплаты...' : 'Ожидаем оплату'}
        </p>
      </div>
    </Modal>
  );
};

export default SbpQrModal;
