export function formatPrice(amount: string | number | null | undefined): string {
  if (amount == null || amount === '') return '—';

  const normalized =
    typeof amount === 'number'
      ? amount
      : Number(String(amount).replace(/[^\d.-]/g, ''));

  if (!Number.isFinite(normalized)) return String(amount);

  return Math.round(normalized)
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
}

export function formatPriceRub(amount: string | number | null | undefined): string {
  const formatted = formatPrice(amount);
  return formatted === '—' ? formatted : `${formatted} ₽`;
}

export function formatPriceFromLabel(amount: string | number | null | undefined): string {
  const formatted = formatPrice(amount);
  return formatted === '—' ? formatted : `от ${formatted} ₽`;
}
