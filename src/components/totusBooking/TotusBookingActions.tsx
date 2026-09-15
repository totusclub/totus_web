import React from 'react';
import Link from 'next/link';
import styles from './totusBooking.module.css';
import { buildHotelDetailsDeepLinkQuery } from '@/utils/hotelDetailsUtils';
import type { TotusBooking } from '@/utils/totusBooking';

export const SUPPORT_CHAT_PATH = '/profile/support-chat';

/** Ссылка на страницу отеля (наш hotel_id = id отеля в каталоге) или на главную/поиск. */
export function getTotusPickAnotherRoomHref(
  booking: TotusBooking | null | undefined,
): { pathname: string; query?: Record<string, string> } {
  const hotelId = booking?.hotel?.id;
  if (hotelId && hotelId > 0) {
    return { pathname: '/hotel-details', query: buildHotelDetailsDeepLinkQuery(hotelId) };
  }
  return { pathname: '/' };
}

type Props = {
  booking: TotusBooking;
  /** На мобильной карточке кнопки в столбик на всю ширину. */
  fullWidth?: boolean;
  className?: string;
};

/**
 * Кнопки внутреннего бронирования: «Написать в поддержку» (существующий чат поддержки)
 * и при отклонении/отмене — «Подобрать другой номер».
 */
const TotusBookingActions: React.FC<Props> = ({ booking, fullWidth = false, className }) => {
  const rejected = booking.status === 'rejected' || booking.status === 'cancelled';
  const fullClass = fullWidth ? ` ${styles.btnFull}` : '';

  const stop = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

  return (
    <div className={`${styles.actions}${className ? ` ${className}` : ''}`} onClick={stop}>
      {rejected ? (
        <Link
          href={getTotusPickAnotherRoomHref(booking)}
          className={`${styles.btn} ${styles.btnPrimary}${fullClass}`}
        >
          Подобрать другой номер
        </Link>
      ) : null}
      <Link
        href={SUPPORT_CHAT_PATH}
        className={`${styles.btn} ${styles.btnSecondary}${fullClass}`}
      >
        Написать в поддержку
      </Link>
    </div>
  );
};

export default TotusBookingActions;
