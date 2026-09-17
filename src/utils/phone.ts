/**
 * Российские номера телефона — решение владельца: принимаем только +7 / 8.
 * Та же проверка, что на сервере (totus_API lib/phone.js): код страны 7,
 * код зоны 3xx / 4xx / 8xx / 9xx (6xx и 7xx — Казахстан, не принимаем).
 */
const RU_ZONE = /^[3489]/;

export const RU_PHONE_HINT = 'Введите российский номер: +7 или 8, 11 цифр';

/** Номер в виде +7XXXXXXXXXX или null, если это не российский номер. */
export function normalizeRuPhone(value: unknown): string | null {
    let digits = String(value ?? '').replace(/\D/g, '');

    if (digits.length === 11 && (digits[0] === '8' || digits[0] === '7')) {
        digits = `7${digits.slice(1)}`;
    } else if (digits.length === 10) {
        digits = `7${digits}`;
    } else {
        return null;
    }

    const zone = digits.slice(1);
    if (zone.length !== 10 || !RU_ZONE.test(zone)) return null;
    return `+${digits}`;
}

export function isRuPhone(value: unknown): boolean {
    return normalizeRuPhone(value) !== null;
}

/** Маска ввода: +7 999 123-45-67. Лишние символы и чужие коды стран просто не набираются. */
export function formatRuPhoneInput(value: string): string {
    let digits = String(value || '').replace(/\D/g, '');
    if (!digits) return '';
    if (digits[0] === '8' || digits[0] === '7') digits = digits.slice(1);
    digits = digits.slice(0, 10);

    const parts = [
        digits.slice(0, 3),
        digits.slice(3, 6),
        digits.slice(6, 8),
        digits.slice(8, 10),
    ].filter(Boolean);

    let out = '+7';
    if (parts[0]) out += ` ${parts[0]}`;
    if (parts[1]) out += ` ${parts[1]}`;
    if (parts[2]) out += `-${parts[2]}`;
    if (parts[3]) out += `-${parts[3]}`;
    return out;
}
