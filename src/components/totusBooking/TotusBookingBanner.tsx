import React from 'react';
import styles from './totusBooking.module.css';
import { ToneIcon } from './TotusBookingIcons';
import {
  getTotusBookingBanner,
  getTotusBookingTone,
  type TotusBooking,
} from '@/utils/totusBooking';

const TONE_CLASS: Record<string, string> = {
  pending: styles.bannerPending,
  success: styles.bannerSuccess,
  danger: styles.bannerDanger,
  info: styles.bannerInfo,
  neutral: '',
};

type Props = {
  booking: TotusBooking;
  /** Переопределить заголовок/текст (например, на экране «Оплата прошла»). */
  title?: string;
  text?: string;
  className?: string;
};

/** Цветной баннер статуса внутреннего бронирования (жёлтый / зелёный / красный). */
const TotusBookingBanner: React.FC<Props> = ({ booking, title, text, className }) => {
  const tone = getTotusBookingTone(booking.status);
  const content = getTotusBookingBanner(booking);
  const finalTitle = title ?? content.title;
  const finalText = text ?? content.text;

  return (
    <div
      className={`${styles.banner} ${TONE_CLASS[tone] ?? ''}${className ? ` ${className}` : ''}`}
      role="status"
    >
      <span className={styles.bannerIcon}>
        <ToneIcon tone={tone} />
      </span>
      <div className={styles.bannerBody}>
        {finalTitle ? <p className={styles.bannerTitle}>{finalTitle}</p> : null}
        {finalText ? <p className={styles.bannerText}>{finalText}</p> : null}
      </div>
    </div>
  );
};

export default TotusBookingBanner;
