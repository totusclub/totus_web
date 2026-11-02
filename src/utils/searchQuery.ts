/**
 * Поле «Куда» на /search (план claude/HOTEL_SEARCH_PROGRESSIVE_PLAN_RU.md, этап 3, 02.11.2026).
 *
 * Модуль без импортов: проверка scripts/check-search-type-filters.mjs грузит его в Node напрямую.
 */

/**
 * Что показать в поле «Куда» и в строке шапки на /search: город / отель из адреса,
 * иначе — название страны из адреса. Раньше страну брали из прошлого выбора в форме
 * (или показывали подсказку «Египет»), хотя в адресе была другая страна.
 */
export function destinationLabel(options: {
    toCity?: string | null;
    toCountry?: string | null;
    headerName?: string | null;
    countries: Array<{ iso2: string; name: string }>;
}): string {
    const city = String(options.toCity || '').trim();
    if (city) return city;
    const iso2 = String(options.toCountry || '').trim().toUpperCase();
    if (iso2) {
        const country = options.countries.find((c) => String(c.iso2).toUpperCase() === iso2);
        if (country?.name) return country.name;
    }
    return String(options.headerName || '');
}
