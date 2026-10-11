/**
 * Единая запись цены на сайте (утверждено 09.10.2026, «Отель на телефоне»):
 * тысячи — узкий неразрывный пробел (U+202F), перед ₽ — неразрывный пробел (U+00A0),
 * чтобы «270 802 ₽» не разрывалось на две строки. Знак ₽ рисует шрифт «Totus Symbols» (globals.css).
 */
// Символы заданы кодами: невидимые пробелы в исходнике легко потерять при правке.
export const THOUSANDS_SEP = String.fromCharCode(0x202f);
export const RUB_SUFFIX = `${String.fromCharCode(0xa0)}₽`;

/** 270802 → «270 802» (узкий пробел). Только цифры, без знака валюты. */
export function groupThousands(value: string | number): string {
  return String(value).replace(/\B(?=(\d{3})+(?!\d))/g, THOUSANDS_SEP);
}

export function formatPrice(amount: string | number | null | undefined): string {
  if (amount == null || amount === '') return '—';

  const normalized =
    typeof amount === 'number'
      ? amount
      : Number(String(amount).replace(/[^\d.-]/g, ''));

  if (!Number.isFinite(normalized)) return String(amount);

  return groupThousands(Math.round(normalized));
}

export function formatPriceRub(amount: string | number | null | undefined): string {
  const formatted = formatPrice(amount);
  return formatted === '—' ? formatted : `${formatted}${RUB_SUFFIX}`;
}

export function formatPriceFromLabel(amount: string | number | null | undefined): string {
  const formatted = formatPrice(amount);
  return formatted === '—' ? formatted : `от ${formatted}${RUB_SUFFIX}`;
}
