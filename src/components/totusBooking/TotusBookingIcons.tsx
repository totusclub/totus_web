import React from 'react';
import type { TotusBookingTone } from '@/utils/totusBooking';
import TotusIcon from '@/components/icons/totus/TotusIcon';
import {
  iconCheck,
  iconDocVoucher,
  iconStConfirmed,
  iconStProcessing,
  iconStRejected,
} from '@/components/icons/totus/icons.generated';

type IconProps = { size?: number; className?: string };

/*
 * Иконки брони — из набора Totus (стиль C). Статусы — одним цветом тона (currentColor),
 * без оранжевой детали: цвет уже несёт смысл (жёлтый / зелёный / красный).
 */

/** Часы — «Проверяем бронирование». */
export const ClockIcon = ({ size = 24, className }: IconProps) => (
  <TotusIcon icon={iconStProcessing} size={size} className={className} accent={false} />
);

/** Галочка в круге — «Подтверждено» / «Оплата прошла». */
export const CheckCircleIcon = ({ size = 24, className }: IconProps) => (
  <TotusIcon icon={iconStConfirmed} size={size} className={className} accent={false} />
);

/** Крестик в круге — «Отклонено» / «Отменено». */
export const CloseCircleIcon = ({ size = 24, className }: IconProps) => (
  <TotusIcon icon={iconStRejected} size={size} className={className} accent={false} />
);

/** Простая галочка — крупная иконка успеха. */
export const CheckIcon = ({ size = 32, className }: IconProps) => (
  <TotusIcon icon={iconCheck} size={size} className={className} accent={false} />
);

/** Документ — ваучер. */
export const DocumentIcon = ({ size = 20, className }: IconProps) => (
  <TotusIcon icon={iconDocVoucher} size={size} className={className} />
);

export const ToneIcon = ({ tone, size = 24 }: { tone: TotusBookingTone; size?: number }) => {
  if (tone === 'success') return <CheckCircleIcon size={size} />;
  if (tone === 'danger') return <CloseCircleIcon size={size} />;
  return <ClockIcon size={size} />;
};
