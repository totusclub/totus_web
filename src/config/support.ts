/**
 * Поддержка: адресат звонка и телефон.
 *
 * Значения совпадают с приложением (`totus_APP/src/modules/support/supportConstants.ts`) —
 * звонок из браузера уходит на тот же аккаунт поддержки, что и из приложения.
 * Вынесено в переменные окружения, чтобы менять без релиза.
 */
export const SUPPORT_LOYALTY_ID =
    process.env.NEXT_PUBLIC_SUPPORT_LOYALTY_ID || '0978 6356 3712 8057';

export const SUPPORT_DISPLAY_NAME = 'Поддержка Totus';

/** Пусто — строку «Или позвоните: …» не показываем. */
export const SUPPORT_PHONE_NUMBER = process.env.NEXT_PUBLIC_SUPPORT_PHONE || '';

export function formatSupportPhone(raw: string = SUPPORT_PHONE_NUMBER): string {
    const digits = raw.replace(/\D/g, '');
    if (digits.length !== 11) return raw;
    const d = digits.startsWith('8') ? `7${digits.slice(1)}` : digits;
    return `+${d[0]} ${d.slice(1, 4)} ${d.slice(4, 7)}-${d.slice(7, 9)}-${d.slice(9, 11)}`;
}
