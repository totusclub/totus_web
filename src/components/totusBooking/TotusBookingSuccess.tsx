import React, { useMemo } from 'react';
import Link from 'next/link';
import styles from './totusBooking.module.css';
import TotusBookingBanner from './TotusBookingBanner';
import { CheckIcon } from './TotusBookingIcons';
import {
  formatTotusGuests,
  formatTotusMoney,
  formatTotusStayPeriod,
  type TotusBooking,
} from '@/utils/totusBooking';

type Props = {
  orderId: string;
  /** `totus_booking` из ответа /check_pay (может отсутствовать — тогда без деталей). */
  booking?: TotusBooking | null;
};

const STEPS = [
  {
    title: 'Проверяем наличие мест у отеля',
    text: 'Обычно это занимает несколько часов, максимум — 24 часа',
  },
  {
    title: 'Пришлём решение',
    text: 'Push-уведомление и письмо на e-mail, статус также виден в разделе «Мои заказы»',
  },
  {
    title: 'Ваучер появится в заказе',
    text: 'Если мест нет — деньги вернутся на карту в течение 1–3 дней',
  },
];

function formatShortPeriod(booking: TotusBooking | null | undefined): string {
  if (!booking?.checkIn || !booking?.checkOut) return '';
  const start = new Date(booking.checkIn);
  const end = new Date(booking.checkOut);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return '';
  const dayFmt = new Intl.DateTimeFormat('ru-RU', { day: 'numeric' });
  const dayMonthFmt = new Intl.DateTimeFormat('ru-RU', { day: 'numeric', month: 'long' });
  const sameMonth = start.getMonth() === end.getMonth();
  return sameMonth
    ? `${dayFmt.format(start)} – ${dayMonthFmt.format(end)}`
    : `${dayMonthFmt.format(start)} – ${dayMonthFmt.format(end)}`;
}

/**
 * Экран после успешной оплаты внутреннего заказа (макет «Web / Оформление — успех»):
 * «Оплата прошла» → баннер «Проверяем бронирование» → 3 шага → «Перейти к заказу» / «На главную».
 */
const TotusBookingSuccess: React.FC<Props> = ({ orderId, booking }) => {
  const subtitle = useMemo(() => {
    const parts: string[] = [];
    const paid = formatTotusMoney(booking?.paidAmount ?? booking?.finalPrice);
    if (paid) parts.push(`Оплачено ${paid}`);

    const hotel = booking?.hotel;
    if (hotel?.name) {
      parts.push(hotel.stars ? `${hotel.name} ${hotel.stars}*` : hotel.name);
    }
    if (booking?.room) parts.push(booking.room);

    const period = formatShortPeriod(booking) || formatTotusStayPeriod(booking);
    if (period) parts.push(period);

    const guests = formatTotusGuests(booking);
    if (guests) parts.push(guests);

    if (booking?.operator) parts.push(`Туроператор: ${booking.operator}`);

    const head = `Бронирование № ${orderId} отправлено на подтверждение.`;
    return parts.length ? `${head} ${parts.join(' · ')}` : head;
  }, [booking, orderId]);

  const orderHref = `/profile/my-orders/${encodeURIComponent(orderId)}`;

  return (
    <div className={styles.successWrap}>
      <div className={styles.successIcon}>
        <CheckIcon size={34} />
      </div>

      <div className={styles.successHead}>
        <h1 className={styles.successTitle}>Оплата прошла</h1>
        <p className={styles.successSubtitle}>{subtitle}</p>
      </div>

      {booking ? (
        <TotusBookingBanner
          booking={{ ...booking, status: 'pending_confirmation' }}
          title="Проверяем бронирование"
          text="Подтвердим в течение 24 часов и пришлём ваучер. Если мест у отеля не окажется — вернём деньги полностью."
        />
      ) : null}

      <div className={styles.successSteps}>
        <p className={styles.successStepsTitle}>Что дальше</p>
        {STEPS.map((step, index) => (
          <div className={styles.successStep} key={step.title}>
            <span className={styles.successStepNum}>{index + 1}</span>
            <div className={styles.successStepBody}>
              <p className={styles.successStepTitle}>{step.title}</p>
              <p className={styles.successStepText}>{step.text}</p>
            </div>
          </div>
        ))}
      </div>

      <div className={styles.successActions}>
        <Link href={orderHref} className={`${styles.btn} ${styles.btnPrimary}`}>
          Перейти к заказу
        </Link>
        <Link href="/" className={`${styles.btn} ${styles.btnSecondary}`}>
          На главную
        </Link>
      </div>
    </div>
  );
};

export default TotusBookingSuccess;
