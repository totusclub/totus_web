/**
 * Соответствия справочников Level.Travel и иконок Totus (стиль C).
 *
 * Каждая функция всегда возвращает существующий ключ: для нового, ещё не известного
 * значения LT — запасную иконку группы. Таблицы — claude/ICONS_PLAN_RU.md, разделы 4–9.
 * Проверка, что все ключи существуют: node scripts/icons/check-totus-icons.mjs
 */
import type { TotusIconKey } from './registry.generated';

type Id = string | number | null | undefined;
const norm = (v: Id) => String(v ?? '').trim().toUpperCase();

/** Питание (`meals`, коды LT) — 19 кодов → 9 иконок + запасная. */
export const MEAL_ICONS: Record<string, TotusIconKey> = {
    RO: 'meal-none',
    BB: 'meal-breakfast',
    BBL: 'meal-breakfast',
    BB2: 'meal-breakfast',
    LNC: 'meal-lunch',
    DNR: 'meal-dinner',
    HB: 'meal-half',
    'HB+': 'meal-half',
    HBD: 'meal-half',
    HBL: 'meal-half',
    HBDL: 'meal-half',
    FB: 'meal-full',
    'FB+': 'meal-full',
    AI: 'meal-ai',
    AI24: 'meal-ai',
    AIL: 'meal-ai',
    UAI: 'meal-uai',
    AIP: 'meal-uai',
    ML: 'meal-included',
};
export const mealIcon = (code: Id): TotusIconKey => MEAL_ICONS[norm(code)] ?? 'meal-other';

/** Тип размещения (`hotel_type`, id LT) — 15 типов + запасная. */
export const HOTEL_TYPE_ICONS: Record<string, TotusIconKey> = {
    '2': 'type-hotel',
    '49': 'type-apart-hotel',
    '29': 'type-apartments',
    '15': 'type-villa',
    '12': 'type-cottage',
    '7': 'type-guest-house',
    '43': 'type-mini-hotel',
    '52': 'type-glamping',
    '46': 'type-sanatorium',
    '48': 'type-resort-base',
    '45': 'type-pension',
    '53': 'type-excursion',
    '11': 'type-chalet',
    '44': 'type-bungalow',
    '13': 'type-hostel',
};
export const hotelTypeIcon = (id: Id): TotusIconKey => HOTEL_TYPE_ICONS[norm(id)] ?? 'type-other';

/** Wi-Fi (`wifi`). «В лобби» показывается подписью, иконка та же. */
export const WIFI_ICONS: Record<string, TotusIconKey> = {
    FREE: 'wifi-free',
    LOBBY_FREE: 'wifi-free',
    LOBBY_UNKNOWN: 'wifi-free',
    PAID: 'wifi-paid',
    LOBBY_PAID: 'wifi-paid',
    NONE: 'wifi-none',
};
export const wifiIcon = (id: Id): TotusIconKey => WIFI_ICONS[norm(id)] ?? 'wifi-free';

/** Покрытие пляжа (`beach_surface`). */
export const BEACH_SURFACE_ICONS: Record<string, TotusIconKey> = {
    SAND: 'surface-sand',
    PEBBLE: 'surface-pebble',
    'SAND+PEBBLE': 'surface-mixed',
    SAND_PEBBLE: 'surface-mixed',
    PLATFORM: 'surface-platform',
    CONCRETE: 'surface-concrete',
    CORAL: 'surface-coral',
    ROCKS: 'surface-rocks',
};
export const beachSurfaceIcon = (id: Id): TotusIconKey => BEACH_SURFACE_ICONS[norm(id)] ?? 'surface-sand';

/** Тип пляжа (`beach_type`). */
export const beachTypeIcon = (id: Id): TotusIconKey => (norm(id) === 'PUBLIC' ? 'beach-public' : 'beach-own');

/** Категория отеля (`category`). */
export const CATEGORY_ICONS: Record<string, TotusIconKey> = {
    FAMILY: 'cat-family',
    COUPLES: 'cat-couples',
    ACTIVE: 'cat-active',
};
export const categoryIcon = (id: Id): TotusIconKey => CATEGORY_ICONS[norm(id)] ?? 'cat-family';

/** Подтверждение (`confirmability`): 1 — мгновенное, 2 — быстрое, 3 — любое. */
export const confirmabilityIcon = (id: Id): TotusIconKey => {
    const v = norm(id);
    if (v === '1') return 'instant';
    if (v === '2') return 'confirm-fast';
    return 'confirm-any';
};

/** Тип отдыха региона (`regions[].rest_type`). */
export const REST_TYPE_ICONS: Record<string, TotusIconKey> = {
    BEACH: 'rest-beach',
    SIGHTSEEING: 'rest-sightseeing',
    SKI: 'rest-ski',
};
export const restTypeIcon = (id: Id): TotusIconKey => REST_TYPE_ICONS[norm(id)] ?? 'rest-sightseeing';

/** Иконки групп фильтров, у которых одна иконка на всю группу. */
export const FILTER_GROUP_ICONS: Record<string, TotusIconKey> = {
    filter_instant_confirm: 'instant',
    filter_prices: 'price',
    filter_stars: 'stars',
    filter_line: 'line',
    filter_rating: 'rating',
};

/** Удобства-переключатели и скрытые фильтры LT (`filter_*` → иконка). */
export const AMENITY_ICONS: Record<string, TotusIconKey> = {
    filter_adults_only: 'adults-only',
    filter_direct_flight: 'direct-flight',
    filter_aquapark: 'aquapark',
    filter_pool: 'pool',
    filter_kids_pool: 'kids-pool',
    filter_heated_pool: 'heated-pool',
    filter_kids_club: 'kids-club',
    filter_kids_menu: 'kids-menu',
    filter_nanny: 'nanny',
    filter_aircon: 'aircon',
    filter_parking: 'parking',
    filter_bar: 'bar',
    filter_massage: 'massage',
    filter_thermal_fun: 'thermal',
    filter_no_single_men: 'no-single-men',
    // есть в ответе LT, на сайте пока не показаны
    filter_aeroflot_flight: 'aeroflot',
    filter_ski_distance: 'ski-lift',
    filter_ski_in: 'ski-in',
    filter_ski_out: 'ski-out',
    filter_free_cancel: 'free-cancel',
    filter_fitness: 'fitness',
    filter_indoor_pool: 'indoor-pool',
};
/** Принимает и `filter_pool`, и `pool`. */
export const amenityIcon = (key: string): TotusIconKey | undefined =>
    AMENITY_ICONS[key] ?? AMENITY_ICONS['filter_' + key];

/** Удобства номера (`/hotels-rooms` → facilities[].group_identifier). */
export const ROOM_FACILITY_ICONS: Record<string, TotusIconKey> = {
    balcony: 'balcony',
    bathrobes: 'bathrobes',
    bathroom: 'bathroom',
    bidet: 'bidet',
    'bungalow-location': 'bungalow',
    cabinet: 'cabinet',
    canteen: 'canteen',
    'change-of-clothes': 'linen',
    'childrens-bed': 'baby-bed',
    cleaning: 'cleaning',
    'clothes-dryer': 'dryer',
    conditioner: 'conditioner',
    crockery: 'crockery',
    'extra-bed': 'extra-bed',
    heating: 'heating',
    iron: 'iron',
    'ipod-docking-station': 'dock',
    jacuzzi: 'jacuzzi',
    kitchen: 'kitchen',
    'kitchen-appliances': 'appliances',
    lounge: 'lounge',
    'mini-bar': 'minibar',
    mirror: 'mirror',
    'orthopedic-mattress': 'mattress',
    phone: 'room-phone',
    plate: 'stove',
    'room-service': 'room-service',
    safe: 'safe',
    'several-bedrooms': 'bedrooms',
    shower: 'shower',
    sofa: 'sofa',
    soundproofing: 'soundproof',
    table: 'table',
    'tea-set': 'tea-set',
    toilet: 'toilet',
    toiletry: 'toiletries',
    tv: 'tv',
    wardrobe: 'wardrobe',
    'washing-machine': 'washing',
    'wi-fi': 'room-wifi',
    // покрытие пола — одна иконка
    carpet: 'floor',
    moquette: 'floor',
    laminate: 'floor',
    parquet: 'floor',
    tile: 'floor',
    // общие удобства — одна иконка
    'shared-bathroom': 'shared',
    'shared-shower': 'shared',
    'shared-toilet': 'shared',
};

/** Значения LT без группы — по названию. */
const ROOM_FACILITY_BY_NAME: Record<string, TotusIconKey> = {
    'халаты': 'bathrobes',
    'смена постельного белья': 'linen',
    'кухонный уголок': 'kitchen',
    'система климат-контроля': 'conditioner',
};

export function roomFacilityIcon(groupIdentifier: Id, name?: string | null): TotusIconKey {
    const g = String(groupIdentifier ?? '').trim().toLowerCase();
    if (g && ROOM_FACILITY_ICONS[g]) return ROOM_FACILITY_ICONS[g];
    const n = String(name ?? '').trim().toLowerCase();
    return ROOM_FACILITY_BY_NAME[n] ?? 'facility-other';
}

/** Вид уведомления (components/notifications/CategoryIcon.tsx → CategoryIconKind). */
export const NOTIFICATION_ICONS: Record<string, TotusIconKey> = {
    order: 'n-order',
    payment: 'n-payment',
    document: 'doc-voucher',
    chat: 'chat',
    call: 'n-missed-call',
    plane: 'n-reminder',
    tag: 'n-promo',
    info: 'info',
    bell: 'bell',
};
export const notificationIcon = (kind: string): TotusIconKey => NOTIFICATION_ICONS[kind] ?? 'bell';
