/**
 * Теги выбранных фильтров над списком отелей (Figma: List / Tours).
 *
 * Источник правды по применённым фильтрам — payload `state.search.hotels`
 * (searchFilters echo'ит filter_* обратно в hotels), списки опций — `hotels.filters.*`.
 * Здесь же — единые русские подписи опций, которые использует и CheckboxGroup.
 */

export type FilterChip = {
    /** ключ параметра API, напр. 'filter_stars' */
    key: string;
    /** id опции для CSV-фильтров; null для булевых / цены */
    value: string | null;
    label: string;
};

type AnyRecord = Record<string, any>;

/** CSV-фильтры: параметр → фасет в hotels.filters */
export const CSV_FILTER_FACETS: Record<string, string> = {
    filter_stars: 'stars',
    filter_meals: 'meals',
    filter_hotel_type: 'hotel_type',
    filter_regions: 'regions',
    filter_line: 'line',
    filter_operators: 'operators',
    filter_rating: 'rating',
    filter_wifi: 'wifi',
    filter_beach_surface: 'beach_surface',
    filter_beach_type: 'beach_type',
    filter_category: 'category',
    filter_confirmability: 'confirmability',
};

/** Булевые удобства: параметр → подпись */
export const BOOL_FILTER_LABELS: Record<string, string> = {
    filter_adults_only: 'Только для взрослых',
    filter_direct_flight: 'Прямой перелёт',
    filter_aquapark: 'Аквапарк',
    filter_pool: 'Бассейн',
    filter_kids_pool: 'Детский бассейн',
    filter_heated_pool: 'Подогреваемый бассейн',
    filter_kids_club: 'Детский клуб',
    filter_kids_menu: 'Детское меню',
    filter_nanny: 'Няня',
    filter_aircon: 'Кондиционер',
    filter_parking: 'Парковка',
    filter_bar: 'Бар',
    filter_massage: 'Массаж',
    filter_thermal_fun: 'Термальные процедуры',
    filter_no_single_men: 'Без одиноких мужчин',
};

const WIFI_LABELS: Record<string, string> = {
    FREE: 'Бесплатный Wi-Fi',
    PAID: 'Платный Wi-Fi',
    LOBBY_FREE: 'Бесплатный Wi-Fi в лобби',
    LOBBY_PAID: 'Платный Wi-Fi в лобби',
    LOBBY_UNKNOWN: 'Wi-Fi в лобби',
    NONE: 'Без Wi-Fi',
};
const BEACH_SURFACE_LABELS: Record<string, string> = {
    SAND: 'Песок',
    PEBBLE: 'Галька',
    'SAND+PEBBLE': 'Песок с галькой',
    SAND_PEBBLE: 'Песок с галькой',
    PLATFORM: 'Платформа',
    CONCRETE: 'Бетон',
    CORAL: 'Коралл',
    ROCKS: 'Скалы',
};
const BEACH_TYPE_LABELS: Record<string, string> = {
    DESIGNATED: 'Собственный пляж',
    PUBLIC: 'Общественный пляж',
};
const CATEGORY_LABELS: Record<string, string> = {
    FAMILY: 'Для семьи',
    COUPLES: 'Для пар',
    ACTIVE: 'Активный отдых',
};
const CONFIRMABILITY_LABELS: Record<string, string> = {
    '1': 'Мгновенное подтверждение',
    '2': 'Быстрое подтверждение',
    '3': 'Любое подтверждение',
};

/** Подпись опции фильтра (единая для чекбоксов сайдбара и тегов). */
export function formatFilterOptionName(name: string | undefined, item: AnyRecord): string {
    const id = item?.id;
    const fallback = () => item?.name || String(id ?? '');

    switch (name) {
        case 'filter_stars': {
            const n = Number(id);
            if (n === 5) return `${n} звёзд`;
            if (n === 1) return `${n} звезда`;
            return `${n} звезды`;
        }
        case 'filter_rating':
            return `от ${id}`;
        case 'filter_wifi':
            return WIFI_LABELS[String(id)] || fallback();
        case 'filter_beach_surface':
            return BEACH_SURFACE_LABELS[String(id)] || fallback();
        case 'filter_beach_type':
            return BEACH_TYPE_LABELS[String(id)] || fallback();
        case 'filter_category':
            return CATEGORY_LABELS[String(id)] || fallback();
        case 'filter_confirmability':
            return CONFIRMABILITY_LABELS[String(id)] || fallback();
        case 'filter_line':
            return `${id}-я линия`;
        default:
            return fallback();
    }
}

function parseCsv(value: unknown): string[] {
    if (value === undefined || value === null) return [];
    if (Array.isArray(value)) return value.map((v) => String(v).trim()).filter(Boolean);
    return String(value)
        .split(',')
        .map((v) => v.trim())
        .filter(Boolean);
}

function formatPrice(value: number): string {
    return String(Math.round(value)).replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
}

export function getPriceBounds(hotels: AnyRecord | null | undefined): { min: number; max: number } | null {
    const prices = hotels?.filters?.prices;
    if (!prices) return null;
    const min = Number(prices.min);
    const max = Number(prices.max);
    if (!Number.isFinite(min) || !Number.isFinite(max)) return null;
    return { min, max: Math.max(min, max) };
}

function availableStarIds(hotels: AnyRecord | null | undefined): string[] {
    const stars = hotels?.filters?.stars;
    if (!Array.isArray(stars)) return [];
    return stars
        .map((s: AnyRecord) => s?.id)
        .filter((id: unknown) => id !== null && id !== undefined && String(id) !== '0')
        .map((id: unknown) => String(id));
}

/** Список тегов по применённым фильтрам. Дефолты (все звёзды, полный диапазон цены) тегами не считаются. */
export function buildFilterChips(hotels: AnyRecord | null | undefined): FilterChip[] {
    if (!hotels) return [];
    const chips: FilterChip[] = [];

    if (hotels.filter_instant_confirm === true || hotels.filter_instant_confirm === 'true') {
        chips.push({ key: 'filter_instant_confirm', value: null, label: 'Быстрое подтверждение' });
    }

    const bounds = getPriceBounds(hotels);
    const priceMin = hotels.filter_price_min != null ? Number(hotels.filter_price_min) : null;
    const priceMax = hotels.filter_price_max != null ? Number(hotels.filter_price_max) : null;
    if (bounds && (priceMin !== null || priceMax !== null)) {
        const min = priceMin ?? bounds.min;
        const max = priceMax ?? bounds.max;
        if (min > bounds.min || max < bounds.max) {
            chips.push({
                key: 'price',
                value: null,
                label: `от ${formatPrice(min)} ₽ – до ${formatPrice(max)} ₽`,
            });
        }
    }

    Object.entries(CSV_FILTER_FACETS).forEach(([key, facet]) => {
        const selected = parseCsv(hotels[key]);
        if (selected.length === 0) return;

        if (key === 'filter_stars') {
            const all = availableStarIds(hotels);
            const allSelected =
                all.length > 0 && all.every((id) => selected.includes(id)) && selected.length >= all.length;
            if (allSelected) return;
        }

        const options: AnyRecord[] = Array.isArray(hotels.filters?.[facet]) ? hotels.filters[facet] : [];
        selected.forEach((id) => {
            const option = options.find((o) => String(o?.id) === id) ?? { id };
            let label = formatFilterOptionName(key, option);
            if (key === 'filter_rating') label = `Рейтинг: ${id}+`;
            chips.push({ key, value: id, label });
        });
    });

    Object.entries(BOOL_FILTER_LABELS).forEach(([key, label]) => {
        const v = hotels[key];
        if (v === true || v === 'true') chips.push({ key, value: null, label });
    });

    return chips;
}

export function countActiveFilters(hotels: AnyRecord | null | undefined): number {
    return buildFilterChips(hotels).length;
}

/**
 * Параметры-переопределения для снятия одного тега.
 * Пустая строка для CSV-фильтра сохраняется намеренно — так очищенный фильтр
 * не подменяется дефолтом (см. sanitizeListingFilterParams).
 */
export function buildRemoveChipParams(
    hotels: AnyRecord | null | undefined,
    chip: FilterChip,
): Record<string, unknown> {
    if (chip.key === 'filter_instant_confirm') return { filter_instant_confirm: false };

    if (chip.key === 'price') {
        const bounds = getPriceBounds(hotels);
        return bounds ? { filter_price_min: bounds.min, filter_price_max: bounds.max } : {};
    }

    if (chip.key in CSV_FILTER_FACETS) {
        const rest = parseCsv(hotels?.[chip.key]).filter((id) => id !== chip.value);
        return { [chip.key]: rest.join(',') };
    }

    if (chip.key in BOOL_FILTER_LABELS) return { [chip.key]: false };

    return {};
}
