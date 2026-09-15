import React from 'react';
import type { TotusBookingTone } from '@/utils/totusBooking';

type IconProps = { size?: number; className?: string };

/** Часы — «Проверяем бронирование». */
export const ClockIcon = ({ size = 24, className }: IconProps) => (
  <svg
    className={className}
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={1.8}
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden
  >
    <circle cx="12" cy="12" r="9" />
    <path d="M12 7v5l3 2" />
  </svg>
);

/** Галочка в круге — «Подтверждено» / «Оплата прошла». */
export const CheckCircleIcon = ({ size = 24, className }: IconProps) => (
  <svg
    className={className}
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={1.8}
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden
  >
    <circle cx="12" cy="12" r="9" />
    <path d="M8.5 12.5l2.5 2.5 4.5-5" />
  </svg>
);

/** Крестик в круге — «Отклонено» / «Отменено». */
export const CloseCircleIcon = ({ size = 24, className }: IconProps) => (
  <svg
    className={className}
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={1.8}
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden
  >
    <circle cx="12" cy="12" r="9" />
    <path d="M9 9l6 6M15 9l-6 6" />
  </svg>
);

/** Простая галочка — крупная иконка успеха. */
export const CheckIcon = ({ size = 32, className }: IconProps) => (
  <svg
    className={className}
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={2.2}
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden
  >
    <path d="M5 12.5l4.5 4.5L19 7.5" />
  </svg>
);

/** Документ — ваучер. */
export const DocumentIcon = ({ size = 20, className }: IconProps) => (
  <svg
    className={className}
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={1.8}
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden
  >
    <path d="M7 3h7l5 5v13H7z" />
    <path d="M14 3v5h5M10 13h6M10 17h6" />
  </svg>
);

export const ToneIcon = ({ tone, size = 24 }: { tone: TotusBookingTone; size?: number }) => {
  if (tone === 'success') return <CheckCircleIcon size={size} />;
  if (tone === 'danger') return <CloseCircleIcon size={size} />;
  return <ClockIcon size={size} />;
};
