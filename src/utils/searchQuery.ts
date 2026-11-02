/**
 * Параметры поиска из адреса /search и переключатель «Тур / Отель» на странице выдачи
 * (план claude/HOTEL_SEARCH_PROGRESSIVE_PLAN_RU.md, этап 3, вариант A макета, 02.11.2026).
 *
 * parseSearchQuery и searchAutoKey — те же правила, что в форме поиска (searchForm.tsx):
 * по ключу форма понимает, что этот поиск уже запущен, и не запускает его второй раз.
 *
 * Модуль без импортов: проверка scripts/check-search-type-switch.mjs грузит его в Node напрямую.
 */

export type SearchTypeValue = 'package' | 'hotel';

type Query = Record<string, string | string[] | undefined>;

export function normalizeSearchType(value: unknown): SearchTypeValue {
    const raw = Array.isArray(value) ? value[0] : value;
    return raw === 'hotel' ? 'hotel' : 'package';
}

function uiPage(value: unknown): number {
    const n = Math.floor(Number(value));
    return Number.isFinite(n) && n >= 1 ? n : 1;
}

/** Как parseSearchParams в searchForm.tsx: массивы чисел, тип поиска, номер страницы. */
export function parseSearchQuery(query: Query): Record<string, unknown> {
    const parsed: Record<string, unknown> = {};
    for (const key in query) {
        const value = query[key];
        if (value === undefined) continue;
        if (key === 'kids_ages' || key === 'hotel_ids') {
            const arrayValues = Array.isArray(value) ? value : [value];
            parsed[key] = arrayValues.map(Number);
        } else if (key === 'search_type') {
            parsed.search_type = normalizeSearchType(value);
        } else if (key === 'page_number') {
            parsed.page_number = uiPage(Array.isArray(value) ? value[0] : value);
        } else if (key === 'page_limit') {
            parsed.page_limit = Math.max(1, Number(Array.isArray(value) ? value[0] : value) || 50);
        } else {
            parsed[key] = Array.isArray(value) ? value[0] : value;
        }
    }
    return parsed;
}

/** Как getAutoSearchKey в searchForm.tsx: всё, кроме страницы, размера страницы и сортировки. */
export function searchAutoKey(query: Query): string {
    const { page_number: _p, page_limit: _l, sort_by: _s, ...core } = parseSearchQuery(query);
    return JSON.stringify(core);
}

/**
 * Фильтры только для тура: в режиме «Отель» не применяются, но и не стираются —
 * при возврате к туру включаются снова (план, «Сохранение как в Tour Search»).
 */
export const TOUR_ONLY_FILTER_KEYS = ['filter_direct_flight'] as const;

/** Цена у тура и отеля разная — диапазон цены при смене типа не переносится (как при новом поиске из формы). */
const NOT_CARRIED_KEYS = ['filter_price_min', 'filter_price_max'];

export type SearchTypeSwitchPlan = {
    /** Новый адрес /search. */
    query: Record<string, string | string[]>;
    /** Ключ поиска — форма в шапке по нему видит, что поиск уже идёт. */
    autoSearchKey: string;
    /** Параметры поиска для runFullSearchFlow. */
    searchParams: Record<string, unknown>;
    /** Фильтры и сортировка выдачи для runFullSearchFlow. */
    filterParams: Record<string, unknown>;
    /** Фильтры только для тура, отложенные на время режима «Отель» (null — нечего откладывать). */
    stashTourOnly: Record<string, unknown> | null;
};

/**
 * Смена «Тур ↔ Отель» на странице выдачи: направление, даты, ночи и туристы — те же,
 * фильтры и сортировка общие (решение владельца Р2), диапазон цены не переносится.
 */
export function planSearchTypeSwitch(options: {
    query: Query;
    nextType: SearchTypeValue;
    /** Применённые фильтры текущей выдачи (hotels + снимок сессии). */
    appliedFilters?: Record<string, unknown> | null;
    /** Отложенные фильтры только для тура (при возврате к туру). */
    stashedTourOnly?: Record<string, unknown> | null;
}): SearchTypeSwitchPlan {
    const nextType = normalizeSearchType(options.nextType);
    const query: Record<string, string | string[]> = {};
    Object.entries(options.query || {}).forEach(([key, value]) => {
        if (value === undefined) return;
        if (key === 'request_id') return;
        query[key] = Array.isArray(value) ? value.map(String) : String(value);
    });
    query.search_type = nextType;
    query.page_number = '1';
    // Тур без города вылета невозможен — как в форме по умолчанию.
    if (nextType === 'package' && !query.from_city) {
        query.from_city = 'Moscow';
        query.from_country = query.from_country || 'RU';
    }

    const applied: Record<string, unknown> = { ...(options.appliedFilters || {}) };
    NOT_CARRIED_KEYS.forEach((key) => delete applied[key]);

    let stashTourOnly: Record<string, unknown> | null = null;
    if (nextType === 'hotel') {
        const stash: Record<string, unknown> = {};
        TOUR_ONLY_FILTER_KEYS.forEach((key) => {
            if (applied[key] !== undefined) stash[key] = applied[key];
            delete applied[key];
        });
        stashTourOnly = Object.keys(stash).length ? stash : null;
    } else if (options.stashedTourOnly) {
        TOUR_ONLY_FILTER_KEYS.forEach((key) => {
            const value = options.stashedTourOnly?.[key];
            if (value !== undefined && applied[key] === undefined) applied[key] = value;
        });
    }

    const parsed = parseSearchQuery(query);
    const filterParams: Record<string, unknown> = {
        filter_instant_confirm: false,
        page_number: 1,
        page_limit: Math.max(1, Number(parsed.page_limit) || 50),
        sort_by: (parsed.sort_by as string) || 'relevance',
    };
    // Как dispatchSearch в форме: у тура по умолчанию 3–5★, у отеля фильтра звёзд нет.
    if (nextType !== 'hotel' && !(Array.isArray(parsed.hotel_ids) && parsed.hotel_ids.length > 0)) {
        filterParams.filter_stars = '3,4,5';
    }
    Object.assign(filterParams, applied);

    return {
        query,
        autoSearchKey: searchAutoKey(query),
        searchParams: { ...parsed, page_number: 1 },
        filterParams,
        stashTourOnly,
    };
}

// --- поле «Куда» ---------------------------------------------------------------------------

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
