/**
 * Внутренние бронирования наших Room Type (оператор Arlekino) — без Level.Travel.
 * Backend отдаёт объект `totus_booking` в `/orders?order_id`, `/user/orders`, `/check_pay`
 * (см. totus_API/docs/CUSTOM_ROOMS_API.md, раздел 6.2).
 */

export type TotusBookingStatus =
  | 'pending_payment'
  | 'pending_confirmation'
  | 'confirmed'
  | 'rejected'
  | 'cancelled';

export type TotusBookingRejectReason =
  | 'no_availability'
  | 'price_changed'
  | 'data_error'
  | 'other';

export type TotusBookingRefund = {
  amount: number | null;
  method: 'manual' | string | null;
  status: 'pending' | 'done' | null;
  at: string | null;
};

export type TotusBookingVoucher = {
  url: string;
  title?: string | null;
  sentAt?: string | null;
};

export type TotusBookingPriceRule = {
  type?: string;
  value?: number;
  label?: string;
};

export type TotusBooking = {
  internal: true;
  bookingId: number | null;
  orderId: string;
  operator: string;
  status: TotusBookingStatus;
  statusLabel: string;
  statusText: string;
  paymentStatus: string | null;
  paidAt: string | null;
  paidAmount: number | null;
  hotelBookingRef: string | null;
  confirmedAt: string | null;
  clientMessage: string | null;
  rejectedAt: string | null;
  rejectReason: TotusBookingRejectReason | null;
  rejectReasonLabel: string | null;
  rejectMessage: string | null;
  refund: TotusBookingRefund | null;
  voucher: TotusBookingVoucher | null;
  hotel: { id: number | null; name: string; stars: number | null; city: string } | null;
  room: string;
  meal: string | null;
  mealName: string | null;
  checkIn: string | null;
  checkOut: string | null;
  nights: number | null;
  adults: number | null;
  kids: number | null;
  providerPrice: number | null;
  finalPrice: number | null;
  priceRule: TotusBookingPriceRule | null;
};

/** Тон статуса → цвет пилюли/баннера (токены темы сайта). */
export type TotusBookingTone = 'pending' | 'success' | 'danger' | 'info' | 'neutral';

export const TOTUS_DEFAULT_OPERATOR = 'Arlekino';

const STATUS_LABELS: Record<TotusBookingStatus, string> = {
  pending_payment: 'Ожидает оплаты',
  pending_confirmation: 'Проверяем бронирование',
  confirmed: 'Бронирование подтверждено',
  rejected: 'Бронирование отклонено',
  cancelled: 'Бронирование отменено',
};

const REJECT_REASON_LABELS: Record<TotusBookingRejectReason, string> = {
  no_availability: 'Нет мест на эти даты',
  price_changed: 'Цена изменилась',
  data_error: 'Ошибка в данных',
  other: 'Другое',
};

function toNumberOrNull(value: unknown): number | null {
  if (value == null || value === '') return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

function toStringOrNull(value: unknown): string | null {
  if (value == null) return null;
  const s = String(value).trim();
  return s ? s : null;
}

function normalizeStatus(value: unknown): TotusBookingStatus {
  const s = String(value ?? '').toLowerCase();
  if (s === 'confirmed') return 'confirmed';
  if (s === 'rejected') return 'rejected';
  if (s === 'cancelled' || s === 'canceled') return 'cancelled';
  if (s === 'pending_payment') return 'pending_payment';
  return 'pending_confirmation';
}

/** Сырой объект `totus_booking` из ответа API (или его усечённый вариант `_totus_booking` внутри package). */
function findRawTotusBooking(order: any): any | null {
  if (!order || typeof order !== 'object') return null;

  const candidates = [
    order.totus_booking,
    order.order?.totus_booking,
    order.package?.totus_booking,
    order.package?._totus_booking,
    order._totus_booking,
    order.package?.package?._totus_booking,
  ];

  for (const candidate of candidates) {
    if (candidate && typeof candidate === 'object' && candidate.internal === true) {
      return candidate;
    }
  }
  return null;
}

/** Заказ внутренний (наш номер, оператор Arlekino) — Level.Travel не участвует. */
export function isTotusInternalOrder(order: any): boolean {
  return findRawTotusBooking(order) != null;
}

/**
 * Нормализованный `totus_booking` для заказа (DB-строка `/orders`, элемент `/user/orders`,
 * ответ `/check_pay`, `{ order, totus_booking }`). `null` — обычный LT-заказ.
 */
export function getTotusBooking(order: any): TotusBooking | null {
  const raw = findRawTotusBooking(order);
  if (!raw) return null;

  const status = normalizeStatus(raw.status);
  const rejectReason = toStringOrNull(raw.rejectReason) as TotusBookingRejectReason | null;
  const refundRaw = raw.refund && typeof raw.refund === 'object' ? raw.refund : null;
  const voucherUrl = toStringOrNull(raw.voucher?.url);
  const hotelRaw = raw.hotel && typeof raw.hotel === 'object' ? raw.hotel : null;

  const orderId =
    toStringOrNull(raw.orderId) ??
    toStringOrNull(order?.order_id) ??
    toStringOrNull(order?.id) ??
    '';

  return {
    internal: true,
    bookingId: toNumberOrNull(raw.bookingId),
    orderId,
    operator: toStringOrNull(raw.operator) ?? TOTUS_DEFAULT_OPERATOR,
    status,
    statusLabel: toStringOrNull(raw.statusLabel) ?? STATUS_LABELS[status],
    statusText: toStringOrNull(raw.statusText) ?? '',
    paymentStatus: toStringOrNull(raw.paymentStatus),
    paidAt: toStringOrNull(raw.paidAt),
    paidAmount: toNumberOrNull(raw.paidAmount),
    hotelBookingRef: toStringOrNull(raw.hotelBookingRef),
    confirmedAt: toStringOrNull(raw.confirmedAt),
    clientMessage: toStringOrNull(raw.clientMessage),
    rejectedAt: toStringOrNull(raw.rejectedAt),
    rejectReason,
    rejectReasonLabel:
      toStringOrNull(raw.rejectReasonLabel) ??
      (rejectReason && REJECT_REASON_LABELS[rejectReason]
        ? REJECT_REASON_LABELS[rejectReason]
        : null),
    rejectMessage: toStringOrNull(raw.rejectMessage),
    refund: refundRaw
      ? {
          amount: toNumberOrNull(refundRaw.amount),
          method: toStringOrNull(refundRaw.method),
          status: refundRaw.status === 'done' ? 'done' : refundRaw.status === 'pending' ? 'pending' : null,
          at: toStringOrNull(refundRaw.at),
        }
      : null,
    voucher: voucherUrl
      ? {
          url: voucherUrl,
          title: toStringOrNull(raw.voucher?.title) ?? 'Ваучер',
          sentAt: toStringOrNull(raw.voucher?.sentAt),
        }
      : null,
    hotel: hotelRaw
      ? {
          id: toNumberOrNull(hotelRaw.id),
          name: toStringOrNull(hotelRaw.name) ?? '',
          stars: toNumberOrNull(hotelRaw.stars),
          city: toStringOrNull(hotelRaw.city) ?? '',
        }
      : null,
    room: toStringOrNull(raw.room) ?? '',
    meal: toStringOrNull(raw.meal),
    mealName: toStringOrNull(raw.mealName),
    checkIn: toStringOrNull(raw.checkIn),
    checkOut: toStringOrNull(raw.checkOut),
    nights: toNumberOrNull(raw.nights),
    adults: toNumberOrNull(raw.adults),
    kids: toNumberOrNull(raw.kids),
    providerPrice: toNumberOrNull(raw.providerPrice),
    finalPrice: toNumberOrNull(raw.finalPrice),
    priceRule: raw.priceRule && typeof raw.priceRule === 'object' ? raw.priceRule : null,
  };
}

export function getTotusBookingStatusLabel(status: TotusBookingStatus): string {
  return STATUS_LABELS[status] ?? STATUS_LABELS.pending_confirmation;
}

export function getTotusRejectReasonLabel(reason: string | null | undefined): string | null {
  if (!reason) return null;
  return REJECT_REASON_LABELS[reason as TotusBookingRejectReason] ?? null;
}

export function getTotusBookingTone(status: TotusBookingStatus): TotusBookingTone {
  switch (status) {
    case 'confirmed':
      return 'success';
    case 'rejected':
    case 'cancelled':
      return 'danger';
    case 'pending_payment':
      return 'info';
    default:
      return 'pending';
  }
}

/** Цвет пилюли статуса (как в `getStatusColor` для LT-заказов — токены темы). */
export function getTotusBookingStatusColor(status: TotusBookingStatus): string {
  const tone = getTotusBookingTone(status);
  if (tone === 'success') return 'var(--primary_green)';
  if (tone === 'danger') return 'var(--primary_red)';
  if (tone === 'info') return 'var(--primary_blue)';
  return 'var(--primary_yellow)';
}

/** Ключ для CSS-классов карточки заказа (`pending` | `confirm` | `cancel`). */
export function getTotusBookingCssKey(status: TotusBookingStatus): 'pending' | 'confirm' | 'cancel' {
  const tone = getTotusBookingTone(status);
  if (tone === 'success') return 'confirm';
  if (tone === 'danger') return 'cancel';
  return 'pending';
}

/** Узкий неразрывный пробел (U+202F) — разделитель тысяч, как в formatOrderPrice. */
const NARROW_NBSP = String.fromCharCode(0x202f);

export function formatTotusMoney(amount: number | null | undefined): string {
  if (amount == null || !Number.isFinite(Number(amount))) return '';
  const rounded = Math.round(Number(amount));
  return `${rounded.toString().replace(/\B(?=(\d{3})+(?!\d))/g, NARROW_NBSP)} ₽`;
}

/** Строка про возврат: pending → «Возврат … ₽ выполним в течение 1–3 дней», done → «Возврат … ₽ выполнен». */
export function formatTotusRefundLine(booking: TotusBooking | null | undefined): string {
  const refund = booking?.refund;
  if (!refund) return '';
  const amount = refund.amount ?? booking?.paidAmount ?? booking?.finalPrice;
  const money = formatTotusMoney(amount);
  const amountPart = money ? ` ${money}` : '';
  if (refund.status === 'done') {
    return `Возврат${amountPart} выполнен`;
  }
  return `Возврат${amountPart} выполним в течение 1–3 дней`;
}

export function formatTotusDateTime(value: string | null | undefined): string {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return new Intl.DateTimeFormat('ru-RU', {
    day: 'numeric',
    month: 'long',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

function parseYmd(value: string | null | undefined): Date | null {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

/** «12 – 19 октября 2026, 7 ночей» из checkIn/checkOut/nights. */
export function formatTotusStayPeriod(booking: TotusBooking | null | undefined): string {
  const start = parseYmd(booking?.checkIn);
  const end = parseYmd(booking?.checkOut);
  if (!start || !end) return '';

  const dayFmt = new Intl.DateTimeFormat('ru-RU', { day: 'numeric' });
  const dayMonthFmt = new Intl.DateTimeFormat('ru-RU', { day: 'numeric', month: 'long' });
  const fullFmt = new Intl.DateTimeFormat('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' });

  const sameMonth =
    start.getMonth() === end.getMonth() && start.getFullYear() === end.getFullYear();
  const range = sameMonth
    ? `${dayFmt.format(start)} – ${fullFmt.format(end)}`
    : `${dayMonthFmt.format(start)} – ${fullFmt.format(end)}`;

  const nights = booking?.nights;
  if (nights && nights > 0) {
    return `${range}, ${nights} ${pluralRu(nights, 'ночь', 'ночи', 'ночей')}`;
  }
  return range;
}

export function formatTotusGuests(booking: TotusBooking | null | undefined): string {
  const adults = booking?.adults ?? 0;
  const kids = booking?.kids ?? 0;
  const parts: string[] = [];
  if (adults > 0) parts.push(`${adults} ${pluralRu(adults, 'взрослый', 'взрослых', 'взрослых')}`);
  if (kids > 0) parts.push(`${kids} ${pluralRu(kids, 'ребёнок', 'ребёнка', 'детей')}`);
  return parts.join(', ');
}

/**
 * Заголовок и подзаголовок баннера статуса (по макетам «ROOMS · Bookings»).
 * statusText от backend — приоритетный подзаголовок, если задан.
 */
export function getTotusBookingBanner(booking: TotusBooking): { title: string; text: string } {
  const paid = formatTotusMoney(booking.paidAmount ?? booking.finalPrice);

  switch (booking.status) {
    case 'confirmed': {
      const when = formatTotusDateTime(booking.confirmedAt);
      const ref = booking.hotelBookingRef ? ` · номер брони ${booking.hotelBookingRef}` : '';
      const title = `Подтверждено${when ? ` ${when}` : ''}${ref}`;
      const text =
        booking.clientMessage ||
        (booking.voucher
          ? 'Ваучер отправлен на e-mail и доступен ниже в документах. Приятного отдыха!'
          : 'Ваучер пришлём на e-mail и добавим в документы заказа. Приятного отдыха!');
      return { title, text };
    }
    case 'rejected':
    case 'cancelled': {
      const reason = booking.rejectReasonLabel ? ` · ${booking.rejectReasonLabel.toLowerCase()}` : '';
      const title = `${booking.status === 'cancelled' ? 'Отменено' : 'Отклонено'}${reason}`;
      const refundLine = formatTotusRefundLine(booking);
      const text = [
        booking.rejectMessage,
        refundLine ? `${refundLine}.` : '',
        'Приносим извинения — подберите другой номер или напишите нам.',
      ]
        .filter(Boolean)
        .join(' ');
      return { title, text };
    }
    case 'pending_payment':
      return {
        title: 'Ожидает оплаты',
        text: booking.statusText || 'Оплатите заказ, и мы отправим бронирование на подтверждение.',
      };
    default:
      return {
        title: `${paid ? `Оплачено ${paid}. ` : ''}Подтвердим в течение 24 часов и пришлём ваучер`,
        text:
          'Мы проверяем наличие мест у отеля. Как только бронирование подтвердится, пришлём push и e-mail. Если мест не окажется — вернём деньги полностью.',
      };
  }
}

export function pluralRu(n: number, one: string, few: string, many: string): string {
  const abs = Math.abs(Math.trunc(n));
  const mod10 = abs % 10;
  const mod100 = abs % 100;
  if (mod10 === 1 && mod100 !== 11) return one;
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return few;
  return many;
}
