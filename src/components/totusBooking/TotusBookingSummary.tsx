import React from 'react';
import styles from './totusBooking.module.css';
import TotusBookingBanner from './TotusBookingBanner';
import TotusBookingActions from './TotusBookingActions';
import { DocumentIcon } from './TotusBookingIcons';
import { resolveDocumentUrl } from '@/utils/orderDisplay';
import {
  formatTotusDateTime,
  formatTotusGuests,
  formatTotusMoney,
  formatTotusRefundLine,
  formatTotusStayPeriod,
  type TotusBooking,
} from '@/utils/totusBooking';

type Props = {
  booking: TotusBooking;
  /** Сумма заказа (если в totus_booking нет paidAmount/finalPrice). */
  fallbackAmount?: number | null;
};

function DetailRow({ label, value, muted }: { label: string; value: string; muted?: boolean }) {
  if (!value) return null;
  return (
    <div className={styles.detailRow}>
      <p className={styles.detailLabel}>{label}</p>
      <p className={`${styles.detailValue}${muted ? ` ${styles.detailValueMuted}` : ''}`}>{value}</p>
    </div>
  );
}

/**
 * Блок в карточке заказа для внутреннего бронирования (Arlekino):
 * баннер статуса → детали (даты, гости, номер брони, туроператор) → «Оплачено / Возврат» → ваучер → действия.
 */
const TotusBookingSummary: React.FC<Props> = ({ booking, fallbackAmount }) => {
  const amount = booking.paidAmount ?? booking.finalPrice ?? fallbackAmount ?? null;
  const paidMoney = formatTotusMoney(amount);
  const rejected = booking.status === 'rejected' || booking.status === 'cancelled';
  const refund = booking.refund;
  const refundMoney = formatTotusMoney(refund?.amount ?? amount);
  const stay = formatTotusStayPeriod(booking);
  const guests = formatTotusGuests(booking);
  const paidAt = formatTotusDateTime(booking.paidAt);
  const voucherUrl = booking.voucher ? resolveDocumentUrl(booking.voucher.url) : '';

  const confirmationValue =
    booking.hotelBookingRef ||
    (booking.status === 'pending_confirmation'
      ? 'после подтверждения'
      : rejected
        ? '—'
        : '');

  return (
    <>
      <TotusBookingBanner booking={booking} />

      <div className={styles.detailsGrid}>
        <DetailRow label="Даты" value={stay} />
        <DetailRow label="Туристы" value={guests} />
        <DetailRow label="Туроператор" value={booking.operator} />
        <DetailRow
          label="Номер подтверждения"
          value={confirmationValue}
          muted={!booking.hotelBookingRef}
        />
        {paidAt ? <DetailRow label="Дата оплаты" value={paidAt} /> : null}
      </div>

      {rejected && refund ? (
        <div
          className={`${styles.payRow} ${refund.status === 'done' ? styles.payRowMuted : styles.payRowDanger}`}
        >
          <p>{refund.status === 'done' ? 'Возврат выполнен' : 'Возврат'}</p>
          <p>{refundMoney}</p>
        </div>
      ) : booking.status !== 'pending_payment' && paidMoney ? (
        <div className={styles.payRow}>
          <p>Оплачено</p>
          <p>{paidMoney}</p>
        </div>
      ) : null}

      {rejected && refund ? (
        <p className={styles.bannerText} style={{ marginTop: 8 }}>
          {formatTotusRefundLine(booking)}
        </p>
      ) : null}

      {booking.status === 'confirmed' ? (
        voucherUrl ? (
          <a
            className={styles.voucherRow}
            href={voucherUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            style={{ marginTop: 12 }}
          >
            <span className={styles.voucherRowIcon}>
              <DocumentIcon />
            </span>
            <span className={styles.voucherRowBody}>
              <p className={styles.voucherRowTitle}>{booking.voucher?.title || 'Ваучер'}</p>
              <p className={styles.voucherRowSub}>
                PDF{booking.hotelBookingRef ? ` · бронь ${booking.hotelBookingRef}` : ''}
              </p>
            </span>
            <p className={styles.voucherRowAction}>Скачать</p>
          </a>
        ) : (
          <div className={styles.voucherRow} style={{ marginTop: 12 }}>
            <span className={styles.voucherRowIcon}>
              <DocumentIcon />
            </span>
            <span className={styles.voucherRowBody}>
              <p className={styles.voucherRowTitle}>Ваучер</p>
              <p className={styles.voucherRowSub}>пришлём на e-mail и добавим в документы заказа</p>
            </span>
            <p className={`${styles.voucherRowAction} ${styles.voucherRowActionMuted}`}>Ожидается</p>
          </div>
        )
      ) : null}

      <TotusBookingActions booking={booking} />
    </>
  );
};

export default TotusBookingSummary;
