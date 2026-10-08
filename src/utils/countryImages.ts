/**
 * Картинки стран для списка «Страна, город, регион или отель».
 *
 * Level.Travel картинок стран фактически не даёт: в подсказках (autocomplete_v2) ссылки
 * `seo_images/…_small_widget.webp` отвечают 404, в справочнике /references/destinations
 * картинок нет. Поэтому — свои: public/countries/<ISO2>.svg, 80×80 (под кружок 40 px на
 * экранах 2x), внутри — WebP ~1,3 КБ. Грузятся только когда список открыт и строка видна
 * (loading="lazy"), браузер кеширует их на 30 дней (next.config.ts).
 */

/** Страны, для которых есть картинка (все 57 направлений из Москвы на 08.10.2026). */
export const COUNTRY_IMAGE_ISO2 = new Set([
    'AB', 'AE', 'AL', 'AM', 'AZ', 'BG', 'BH', 'BY', 'CN', 'CU', 'CY', 'CZ', 'DO', 'EG', 'ES',
    'FI', 'FR', 'GE', 'GR', 'HK', 'HR', 'HU', 'ID', 'IL', 'IN', 'IT', 'JO', 'JP', 'KG', 'KR',
    'KZ', 'LK', 'MA', 'ME', 'MT', 'MU', 'MV', 'MX', 'MY', 'NO', 'OM', 'PH', 'PT', 'QA', 'RS',
    'RU', 'SA', 'SC', 'SG', 'TH', 'TJ', 'TN', 'TR', 'TZ', 'UZ', 'VE', 'VN',
]);

/** '/countries/TR.svg' или '' (картинки нет — вместо неё буква страны). */
export function countryImageSrc(iso2: unknown): string {
    const code = String(iso2 ?? '').trim().toUpperCase();
    return COUNTRY_IMAGE_ISO2.has(code) ? `/countries/${code}.svg` : '';
}

export type BrowseCountry = { id: string | number; name: string; name_en?: string; iso2: string; priority: number };

/**
 * Направления по умолчанию (Level.Travel /references/destinations?from_city=Moscow, 08.10.2026):
 * список открывается сразу, без ожидания сети; затем заменяется свежим ответом API.
 * priority > 1 — «Популярные страны» (порядок как у Level.Travel).
 */
export const DEFAULT_BROWSE_COUNTRIES: BrowseCountry[] = [
    ['TR', 'Турция', 'Turkey', 10], ['EG', 'Египет', 'Egypt', 9], ['VN', 'Вьетнам', 'Vietnam', 8],
    ['RU', 'Россия', 'Russia', 7], ['AE', 'ОАЭ', 'UAE', 6], ['MV', 'Мальдивы', 'Maldives', 5],
    ['TH', 'Таиланд', 'Thailand', 5], ['IN', 'Индия', 'India', 4], ['SC', 'Сейшелы', 'Seychelles', 4],
    ['LK', 'Шри-Ланка', 'Sri Lanka', 4], ['ID', 'Индонезия', 'Indonesia', 3], ['MU', 'Маврикий', 'Mauritius', 3],
    ['CU', 'Куба', 'Cuba', 2], ['AB', 'Абхазия', 'Abhasia', 1], ['AZ', 'Азербайджан', 'Azerbaijan', 1],
    ['AL', 'Албания', 'Albania', 1], ['AM', 'Армения', 'Armenia', 1], ['BH', 'Бахрейн', 'Bahrain', 1],
    ['BY', 'Беларусь', 'Belarus', 1], ['BG', 'Болгария', 'Bulgaria', 1], ['HU', 'Венгрия', 'Hungary', 1],
    ['VE', 'Венесуэла', 'Venezuela', 1], ['HK', 'Гонконг', 'Hongkong', 1], ['GR', 'Греция', 'Greece', 1],
    ['GE', 'Грузия', 'Georgia', 1], ['DO', 'Доминикана', 'Dominican Republic', 0], ['IL', 'Израиль', 'Israel', 1],
    ['JO', 'Иордания', 'Jordan', 1], ['ES', 'Испания', 'Spain', 1], ['IT', 'Италия', 'Italy', 0],
    ['KZ', 'Казахстан', 'Kazakhstan', 1], ['QA', 'Катар', 'Qatar', 1], ['CY', 'Кипр', 'Cyprus', 1],
    ['KG', 'Киргизия', 'Kyrgyzstan', 1], ['CN', 'Китай', 'China', 1], ['MY', 'Малайзия', 'Malaysia', 1],
    ['MT', 'Мальта', 'Malta', 1], ['MA', 'Марокко', 'Morocco', 1], ['MX', 'Мексика', 'Mexico', 1],
    ['NO', 'Норвегия', 'Norway', 1], ['OM', 'Оман', 'Oman', 1], ['PT', 'Португалия', 'Portugal', 1],
    ['SA', 'Саудовская Аравия', 'Saudi Arabia', 1], ['RS', 'Сербия', 'Serbia', 1],
    ['SG', 'Сингапур', 'Republic of Singapore', 1], ['TJ', 'Таджикистан', 'Tajikistan', 1],
    ['TZ', 'Танзания', 'Tanzania', 0], ['TN', 'Тунис', 'Tunisia', 1], ['UZ', 'Узбекистан', 'Uzbekistan', 1],
    ['PH', 'Филиппины', 'Philippines', 1], ['FI', 'Финляндия', 'Finland', 1], ['FR', 'Франция', 'France', 1],
    ['HR', 'Хорватия', 'Croatia', 1], ['ME', 'Черногория', 'Montenegro', 1], ['CZ', 'Чехия', 'Czech Republic', 1],
    ['KR', 'Южная Корея', 'South Korea', 1], ['JP', 'Япония', 'Japan', 1],
].map(([iso2, name, name_en, priority]) => ({
    id: `country-${iso2}`,
    iso2: iso2 as string,
    name: name as string,
    name_en: name_en as string,
    priority: priority as number,
}));

/** Ответ /references/destinations → страны для списка; пустой/кривой ответ → null. */
export function toBrowseCountries(body: unknown): BrowseCountry[] | null {
    const countries = (body as { countries?: unknown })?.countries;
    if (!Array.isArray(countries)) return null;
    const list = countries
        .map((c: any) => ({
            id: c?.id ?? `country-${c?.iso2}`,
            iso2: String(c?.iso2 || '').toUpperCase(),
            name: String(c?.name_ru || c?.name || '').trim(),
            name_en: c?.name_en ? String(c.name_en) : undefined,
            priority: Number(c?.priority) || 0,
        }))
        .filter((c) => c.iso2 && c.name);
    return list.length ? list : null;
}

/** «Популярные страны» (priority > 1, по убыванию) и «Другие страны» (по алфавиту). */
export function splitBrowseCountries(list: BrowseCountry[]): { popular: BrowseCountry[]; other: BrowseCountry[] } {
    const popular = list
        .filter((c) => c.priority > 1)
        .sort((a, b) => b.priority - a.priority || a.name.localeCompare(b.name, 'ru'));
    const other = list
        .filter((c) => c.priority <= 1)
        .sort((a, b) => a.name.localeCompare(b.name, 'ru'));
    return { popular, other };
}
