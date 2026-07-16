import type { HotelRoomFilters, RoomFilterOption } from '@/utils/roomFilters';

export type ListRoomPick = {
  roomType?: string;
  mealType?: string;
  mealId?: string;
  roomId?: number | string;
  roomListingId?: number | string;
  offerId?: string;
  operatorId?: number | string;
  operatorName?: string;
  roomPrice?: number;
  startDate?: string;
};

type OfferLike = {
  id?: string | number;
  price?: number | string;
  analytics_price?: number | string;
  start_date?: string;
  operator_id?: number | string;
  operator_name?: string;
  [key: string]: unknown;
};

type RoomLike = {
  ID?: string | number;
  room?: {
    id?: string | number;
    name_ru?: string;
    name_en?: string;
    accommodation?: string;
  };
  offers?: Record<string, OfferLike[]>;
  meal_types?: Array<{ id?: string; description?: string }>;
  [key: string]: unknown;
};

export const MEAL_LABELS: Record<string, string> = {
  BB: 'Завтрак',
  RO: 'Без питания',
  AI: 'Всё включено',
  UAI: 'Ультра всё включено',
  HB: 'Завтрак и ужин',
  FB: 'Завтрак, обед, ужин',
  HBD: 'Завтрак и ужин',
  AI24: 'Всё включено 24 часа',
  DNR: 'Ужин',
  AIL: 'Всё включено с ограничениями',
  'FB+': 'Завтрак, обед, ужин +',
  'HB+': 'Завтрак и ужин +',
  HBL: 'Завтрак и обед',
};

function normalizePickId(value?: number | string | null): string | undefined {
  if (value == null) return undefined;
  const normalized = String(value).trim();
  return normalized ? normalized : undefined;
}

function normalizeDateKey(dateValue?: string | null): string | null {
  if (!dateValue || typeof dateValue !== 'string') return null;
  const trimmed = dateValue.trim();
  if (!trimmed) return null;
  if (/^\d{4}-\d{2}-\d{2}/.test(trimmed)) return trimmed.slice(0, 10);
  const parsed = new Date(trimmed);
  if (!Number.isNaN(parsed.getTime())) return parsed.toISOString().slice(0, 10);
  return trimmed;
}

function normalizeText(value?: string | null): string {
  if (!value) return '';
  return value.toLowerCase().replace(/\s+/g, ' ').trim();
}

function normalizeRoomName(value?: string | null): string {
  if (!value) return '';
  return value
    .toLowerCase()
    .replace(/\([^)]*\)/g, ' ')
    .replace(/[^a-zа-яё0-9\s+]/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function expandMealIds(ids: string[]): string[] {
  const expanded = new Set(ids.map((id) => id.toUpperCase()));
  // Offer matching only: AI listings often include UAI prices
  if (expanded.has('AI')) expanded.add('UAI');
  return Array.from(expanded);
}

function parseMealIds(mealId: string): string[] {
  return mealId
    .split(',')
    .map((id) => id.trim().toUpperCase())
    .filter(Boolean);
}

function mealIdsFromLabel(mealLabel: string, { exact = false } = {}): string[] {
  return Object.entries(MEAL_LABELS)
    .filter(([, label]) => {
      const normalizedLabel = normalizeText(label);
      if (exact) return normalizedLabel === mealLabel;
      return (
        normalizedLabel === mealLabel ||
        normalizedLabel.includes(mealLabel) ||
        mealLabel.includes(normalizedLabel)
      );
    })
    .map(([id]) => id.toUpperCase());
}

/** Exact meal ids from search pick — no AI→UAI expansion (for room filter UI). */
export function resolveExactMealIdsFromPick(pick: ListRoomPick | null | undefined): string[] {
  if (!pick) return [];

  const mealId = normalizePickId(pick.mealId);
  if (mealId) return parseMealIds(mealId);

  const mealLabel = normalizeText(pick.mealType);
  if (!mealLabel) return [];
  // Exact label only so «Всё включено» does not also match «Ультра всё включено»
  return mealIdsFromLabel(mealLabel, { exact: true });
}

export function resolveMealIdsFromPick(pick: ListRoomPick | null | undefined): string[] {
  if (!pick) return [];

  const mealId = normalizePickId(pick.mealId);
  if (mealId) {
    return expandMealIds(parseMealIds(mealId));
  }

  const mealLabel = normalizeText(pick.mealType);
  if (!mealLabel) return [];

  return expandMealIds(mealIdsFromLabel(mealLabel));
}

function getOfferPrice(offer: OfferLike): number | null {
  const raw = offer.analytics_price ?? offer.price;
  const price = Number(raw);
  return Number.isFinite(price) ? price : null;
}

export function getMealLabel(mealIdOrCsv?: string | null): string {
  if (!mealIdOrCsv) return '';
  const ids = mealIdOrCsv
    .split(',')
    .map((id) => id.trim().toUpperCase())
    .filter(Boolean);
  if (!ids.length) return '';
  const labels = ids.map((id) => MEAL_LABELS[id] || id);
  return labels.join(', ');
}

const MEAL_NAME_TO_CODE: Record<string, string> = Object.fromEntries(
  Object.entries(MEAL_LABELS).map(([code, label]) => [normalizeText(label), code]),
);

/**
 * Normalize listing `filter_meals` (codes or option ids/names) → room meal codes (RO, AI, …).
 */
export function normalizeSearchMealsToRoomCodes(
  filterMeals: string | null | undefined,
  listingMealOptions?: Array<{ id?: string | number; name?: string; selected?: boolean }> | null,
): string[] {
  const rawParts = String(filterMeals ?? '')
    .split(',')
    .map((part) => part.trim())
    .filter(Boolean);

  const knownCodes = new Set(Object.keys(MEAL_LABELS));
  const optionById = new Map<string, { id?: string | number; name?: string }>();
  (listingMealOptions ?? []).forEach((option) => {
    if (option?.id != null) optionById.set(String(option.id), option);
    if (option?.name) optionById.set(normalizeText(option.name), option);
  });

  const resolved: string[] = [];

  const pushCode = (code: string) => {
    const upper = code.toUpperCase();
    if (!resolved.includes(upper)) resolved.push(upper);
  };

  rawParts.forEach((part) => {
    const upper = part.toUpperCase();
    if (knownCodes.has(upper)) {
      pushCode(upper);
      return;
    }

    const byId = optionById.get(part) || optionById.get(upper);
    if (byId) {
      const nameCode = byId.name ? MEAL_NAME_TO_CODE[normalizeText(byId.name)] : undefined;
      const idAsCode = String(byId.id ?? '').toUpperCase();
      if (nameCode) {
        pushCode(nameCode);
        return;
      }
      if (knownCodes.has(idAsCode)) {
        pushCode(idAsCode);
        return;
      }
    }

    const byName = MEAL_NAME_TO_CODE[normalizeText(part)];
    if (byName) {
      pushCode(byName);
      return;
    }

    // Fuzzy: listing option name contains / is contained in the raw part
    for (const option of listingMealOptions ?? []) {
      if (option?.id != null && String(option.id) !== part && String(option.id).toUpperCase() !== upper) {
        continue;
      }
      if (option?.id != null && (String(option.id) === part || String(option.id).toUpperCase() === upper)) {
        const nameCode = option.name ? MEAL_NAME_TO_CODE[normalizeText(option.name)] : undefined;
        if (nameCode) {
          pushCode(nameCode);
          return;
        }
      }
    }

    for (const [code, label] of Object.entries(MEAL_LABELS)) {
      const normalizedLabel = normalizeText(label);
      const normalizedPart = normalizeText(part);
      if (
        normalizedPart &&
        (normalizedLabel === normalizedPart ||
          (normalizedPart.length >= 4 &&
            (normalizedLabel.includes(normalizedPart) || normalizedPart.includes(normalizedLabel))))
      ) {
        // Avoid «Всё включено» matching «Ультра всё включено» via includes alone
        if (code === 'AI' && normalizedPart.includes('ультра')) continue;
        if (code === 'UAI' && normalizedPart === normalizeText(MEAL_LABELS.AI)) continue;
        pushCode(code);
        return;
      }
    }
  });

  // Fallback: selected options from listing filters when filter_meals string is missing/unusable
  if (!resolved.length && listingMealOptions?.length) {
    listingMealOptions
      .filter((option) => option.selected)
      .forEach((option) => {
        const idAsCode = String(option.id ?? '').toUpperCase();
        if (knownCodes.has(idAsCode)) {
          pushCode(idAsCode);
          return;
        }
        const nameCode = option.name ? MEAL_NAME_TO_CODE[normalizeText(option.name)] : undefined;
        if (nameCode) pushCode(nameCode);
      });
  }

  return resolved;
}

/**
 * Resolve active search meal codes for list → hotel-details handoff.
 * Prefer explicit filter_meals; never invent AI when meals were cleared/changed.
 */
export function resolveActiveSearchMealCodes(options: {
  filterMeals?: string | null;
  listingMealOptions?: Array<{ id?: string | number; name?: string; selected?: boolean }> | null;
  searchType?: string | null;
  defaultPackageMeals?: string | null;
}): string[] {
  const fromFilter = normalizeSearchMealsToRoomCodes(
    options.filterMeals,
    options.listingMealOptions,
  );
  if (fromFilter.length) return fromFilter;

  const fromSelectedOptions = normalizeSearchMealsToRoomCodes(
    null,
    options.listingMealOptions,
  );
  if (fromSelectedOptions.length) return fromSelectedOptions;

  // Only for fresh package search with no meal filter state at all
  if (
    options.searchType !== 'hotel' &&
    (options.filterMeals == null || String(options.filterMeals).trim() === '') &&
    !(options.listingMealOptions ?? []).some((option) => option.selected)
  ) {
    const fallback = options.defaultPackageMeals ?? 'AI';
    return normalizeSearchMealsToRoomCodes(fallback, options.listingMealOptions);
  }

  return [];
}

function queryParam(
  query: Record<string, string | string[] | undefined>,
  key: string,
): string | undefined {
  const value = query[key];
  if (Array.isArray(value)) {
    // Multi-value / comma-split query keys (e.g. filter_meals=AI,UAI → ['AI','UAI'])
    const joined = value.map((part) => String(part).trim()).filter(Boolean).join(',');
    return joined || undefined;
  }
  return value;
}

/** Build pick from hotel-details URL (+ optional listing hotel item fields). */
export function buildListRoomPickFromQuery(
  query: Record<string, string | string[] | undefined>,
): ListRoomPick | null {
  const roomType = queryParam(query, 'room_type') || queryParam(query, 'list_room_type');
  const mealType = queryParam(query, 'meal_type') || queryParam(query, 'list_meal_type');
  const mealId =
    queryParam(query, 'meal_id') ||
    queryParam(query, 'filter_meals') ||
    queryParam(query, 'list_meal_id');
  const roomId = queryParam(query, 'room_id') || queryParam(query, 'list_room_id');
  const roomListingId = queryParam(query, 'room_listing_id');
  const offerId = queryParam(query, 'offer_id') || queryParam(query, 'list_offer_id');
  const operatorId =
    queryParam(query, 'operator_id') ||
    queryParam(query, 'filter_operators') ||
    queryParam(query, 'operators') ||
    queryParam(query, 'list_operator_id');
  const operatorName = queryParam(query, 'operator_name');
  const priceRaw = queryParam(query, 'list_price') || queryParam(query, 'room_price');
  const roomPrice = priceRaw != null && priceRaw !== '' ? Number(priceRaw) : undefined;
  const startDate = queryParam(query, 'start_date');

  if (
    !roomType &&
    !mealType &&
    !mealId &&
    !roomId &&
    !roomListingId &&
    !offerId &&
    !operatorId &&
    !operatorName &&
    !(roomPrice != null && Number.isFinite(roomPrice))
  ) {
    return null;
  }

  return {
    roomType: roomType || undefined,
    mealType: mealType || undefined,
    mealId: mealId || undefined,
    roomId: roomId || undefined,
    roomListingId: roomListingId || undefined,
    offerId: offerId || undefined,
    operatorId: operatorId || undefined,
    operatorName: operatorName || undefined,
    roomPrice: roomPrice != null && Number.isFinite(roomPrice) ? roomPrice : undefined,
    startDate: startDate || undefined,
  };
}

/** Pull meal id/type from a dates[*] entry when Level Travel embeds it there. */
function mealFromDatesEntry(entry: unknown): { mealId?: string; mealType?: string } {
  if (entry == null || typeof entry !== 'object') return {};
  const record = entry as Record<string, unknown>;
  const mealId =
    normalizePickId(record.meal_id as string | number) ||
    normalizePickId(record.meal as string | number) ||
    normalizePickId(record.pansion_id as string | number) ||
    undefined;
  const mealType =
    normalizePickId(record.meal_type as string) ||
    normalizePickId(record.meal_name as string) ||
    normalizePickId(record.pansion as string) ||
    normalizePickId(record.pansion_description as string) ||
    undefined;
  return { mealId, mealType };
}

/** Meal fields from a concrete search-list hotel item (not the global search filter). */
export function extractMealFromHotelItem(
  item: Record<string, unknown> | null | undefined,
): { mealId?: string; mealType?: string } {
  if (!item) return {};

  const nested = (item.hotel as Record<string, unknown> | undefined) ?? {};
  let mealId =
    normalizePickId(item.meal_id as string | number) ||
    normalizePickId(nested.meal_id as string | number) ||
    undefined;
  let mealType =
    normalizePickId(item.meal_type as string) ||
    normalizePickId(nested.meal_type as string) ||
    normalizePickId(item.meal_name as string) ||
    normalizePickId(nested.meal_name as string) ||
    undefined;

  if (!mealId || !mealType) {
    const dates = item.dates;
    if (dates && typeof dates === 'object') {
      const entries = Object.values(dates as Record<string, unknown>);
      for (const entry of entries) {
        const fromDate = mealFromDatesEntry(entry);
        if (!mealId && fromDate.mealId) mealId = fromDate.mealId;
        if (!mealType && fromDate.mealType) mealType = fromDate.mealType;
        if (mealId && mealType) break;
      }
    }
  }

  // meal_type may already be a code (AI) — treat as mealId when needed
  if (!mealId && mealType && MEAL_LABELS[mealType.toUpperCase()]) {
    mealId = mealType.toUpperCase();
  }

  return { mealId, mealType };
}

/** Badge label for a hotel card: prefer item meal, else search filter codes. */
export function getHotelItemMealBadgeLabel(
  item: Record<string, unknown> | null | undefined,
  filterMealsFallback?: string | null,
): string {
  const fromItem = extractMealFromHotelItem(item);
  if (fromItem.mealType && !MEAL_LABELS[fromItem.mealType.toUpperCase()]) {
    // Already a human-readable description from the API
    return fromItem.mealType;
  }
  const codeOrCsv = fromItem.mealId || fromItem.mealType || filterMealsFallback || '';
  return getMealLabel(codeOrCsv);
}

/** Extract pick fields from a search-list hotel item when present. */
export function buildListRoomPickFromHotelItem(
  item: Record<string, unknown> | null | undefined,
  options?: {
    filterMeals?: string | null;
    filterOperators?: string | null;
    startDate?: string | null;
  },
): ListRoomPick | null {
  if (!item) return null;

  const nested = (item.hotel as Record<string, unknown> | undefined) ?? {};
  const itemMeal = extractMealFromHotelItem(item);
  const roomType =
    (item.room_type as string) ||
    (nested.room_type as string) ||
    (item.room_name as string) ||
    undefined;
  const mealType = itemMeal.mealType || undefined;
  const mealId =
    itemMeal.mealId ||
    normalizePickId(options?.filterMeals) ||
    undefined;
  const roomId =
    normalizePickId(item.room_id as string | number) ||
    normalizePickId(nested.room_id as string | number);
  const roomListingId =
    normalizePickId(item.room_listing_id as string | number) ||
    normalizePickId(nested.room_listing_id as string | number);
  const offerId =
    normalizePickId(item.offer_id as string | number) ||
    normalizePickId(nested.offer_id as string | number) ||
    normalizePickId(item.tour_id as string | number);
  const operatorId =
    normalizePickId(item.operator_id as string | number) ||
    normalizePickId(nested.operator_id as string | number) ||
    normalizePickId(options?.filterOperators) ||
    undefined;
  const operatorName =
    normalizePickId(item.operator_name as string) ||
    normalizePickId(nested.operator_name as string);
  const priceRaw =
    item.room_price ?? item.analytics_min_price ?? item.min_price ?? nested.room_price;
  const roomPrice = priceRaw != null ? Number(priceRaw) : undefined;
  const startDate =
    normalizePickId(item.start_date as string) ||
    normalizePickId(options?.startDate) ||
    undefined;

  if (
    !roomType &&
    !mealType &&
    !mealId &&
    !roomId &&
    !offerId &&
    !operatorId &&
    !operatorName &&
    !(roomPrice != null && Number.isFinite(roomPrice))
  ) {
    return null;
  }

  return {
    roomType,
    mealType,
    mealId,
    roomId,
    roomListingId,
    offerId,
    operatorId,
    operatorName,
    roomPrice: roomPrice != null && Number.isFinite(roomPrice) ? roomPrice : undefined,
    startDate,
  };
}

export function listRoomPickToQueryParams(pick: ListRoomPick | null | undefined): Record<string, string> {
  if (!pick) return {};
  const params: Record<string, string> = {};
  if (pick.roomType) params.room_type = pick.roomType;
  if (pick.mealType) params.meal_type = pick.mealType;
  if (pick.mealId) {
    params.meal_id = String(pick.mealId);
    params.filter_meals = String(pick.mealId);
  }
  if (pick.roomId != null) params.room_id = String(pick.roomId);
  if (pick.roomListingId != null) params.room_listing_id = String(pick.roomListingId);
  if (pick.offerId) params.offer_id = String(pick.offerId);
  if (pick.operatorId != null) {
    params.operator_id = String(pick.operatorId);
    params.filter_operators = String(pick.operatorId);
  }
  if (pick.operatorName) params.operator_name = pick.operatorName;
  if (pick.roomPrice != null && Number.isFinite(pick.roomPrice)) {
    params.list_price = String(Math.round(pick.roomPrice));
  }
  return params;
}

function getRoomIdentityIds(room: RoomLike): string[] {
  return [room.room?.id, room.ID]
    .filter((value) => value != null)
    .map((value) => String(value));
}

function roomIdentityMatchesPick(room: RoomLike, pick: ListRoomPick): boolean {
  const roomIds = getRoomIdentityIds(room);
  const typeId = normalizePickId(pick.roomId);
  const listingId = normalizePickId(pick.roomListingId);
  if (typeId && roomIds.includes(typeId)) return true;
  if (listingId && roomIds.includes(listingId)) return true;
  return false;
}

function roomNameMatchesPick(room: RoomLike, pick: ListRoomPick): boolean {
  if (!pick.roomType) return false;
  const target = normalizeRoomName(pick.roomType);
  const names = [room.room?.name_ru, room.room?.name_en, room.room?.accommodation]
    .filter(Boolean)
    .map((name) => normalizeRoomName(name as string));

  return names.some((name) => {
    if (!name || !target) return false;
    if (name === target) return true;
    if (name.includes(target) || target.includes(name)) return true;
    const targetTokens = target.split(' ').filter(Boolean);
    const nameTokens = name.split(' ').filter(Boolean);
    if (!targetTokens.length || !nameTokens.length) return false;
    const matchedTokens = targetTokens.filter((token) =>
      nameTokens.some((nameToken) => nameToken.includes(token) || token.includes(nameToken)),
    );
    return matchedTokens.length >= Math.min(2, targetTokens.length);
  });
}

function collectOfferCandidates(
  room: RoomLike,
  pick: ListRoomPick,
  selectedDate: string | null,
): Array<{ mealId: string; offer: OfferLike }> {
  // Exact meals only so search RO/AI does not surface UAI (or other) “other prices”.
  const mealIds = resolveExactMealIdsFromPick(pick);
  const targetDate = normalizeDateKey(pick.startDate) || normalizeDateKey(selectedDate);
  const dated: Array<{ mealId: string; offer: OfferLike }> = [];
  const all: Array<{ mealId: string; offer: OfferLike }> = [];

  Object.entries(room.offers ?? {}).forEach(([mealId, offerList]) => {
    if (mealIds.length && !mealIds.includes(mealId.toUpperCase())) return;
    (offerList ?? []).forEach((offer) => {
      all.push({ mealId, offer });
      if (!targetDate || normalizeDateKey(offer.start_date) === targetDate) {
        dated.push({ mealId, offer });
      }
    });
  });

  return dated.length ? dated : all;
}

function resolveOperatorIdsFromPick(
  pick: ListRoomPick,
  candidates?: Array<{ offer: OfferLike }> | RoomFilterOption[],
): number[] {
  const operatorId = normalizePickId(pick.operatorId);
  if (operatorId) {
    // Support CSV from search `filter_operators` / `operators`.
    const fromCsv = operatorId
      .split(',')
      .map((part) => Number(part.trim()))
      .filter(Number.isFinite);
    if (fromCsv.length) return Array.from(new Set(fromCsv));
  }

  const operatorName = normalizeText(pick.operatorName);
  if (!operatorName || !candidates?.length) return [];

  const first = candidates[0];
  if (first && 'offer' in first) {
    const ids = new Set<number>();
    (candidates as Array<{ offer: OfferLike }>).forEach((item) => {
      const name = normalizeText(item.offer.operator_name);
      if (name === operatorName || name.includes(operatorName) || operatorName.includes(name)) {
        ids.add(Number(item.offer.operator_id));
      }
    });
    return Array.from(ids).filter(Number.isFinite);
  }

  return (candidates as RoomFilterOption[])
    .filter((operator) => {
      const name = normalizeText(operator.name);
      return name === operatorName || name.includes(operatorName) || operatorName.includes(name);
    })
    .map((operator) => Number(operator.id))
    .filter(Number.isFinite);
}

function pickBestOfferCandidate(
  candidates: Array<{ mealId: string; offer: OfferLike }>,
  pick: ListRoomPick,
): { mealId: string; offer: OfferLike } | null {
  if (!candidates.length) return null;

  const operatorIds = resolveOperatorIdsFromPick(pick, candidates);
  let pool = candidates;
  if (operatorIds.length) {
    const byOperator = candidates.filter((item) =>
      operatorIds.includes(Number(item.offer.operator_id)),
    );
    if (byOperator.length) pool = byOperator;
  }

  const offerId = normalizePickId(pick.offerId);
  if (offerId) {
    const byOfferId = pool.find((item) => String(item.offer.id) === offerId);
    if (byOfferId) return byOfferId;
  }

  const targetPrice = pick.roomPrice != null ? Math.round(Number(pick.roomPrice)) : null;
  if (targetPrice != null && pool.length > 0) {
    const exact = pool.find((item) => {
      const price = getOfferPrice(item.offer);
      return price != null && Math.round(price) === targetPrice;
    });
    if (exact) return exact;

    // Only accept a near match (1 ₽ or 0.5%) — otherwise list price stays sticky in the header.
    let closest: { mealId: string; offer: OfferLike } | null = null;
    let closestDiff = Number.POSITIVE_INFINITY;
    pool.forEach((item) => {
      const price = getOfferPrice(item.offer);
      if (price == null) return;
      const diff = Math.abs(Math.round(price) - targetPrice);
      if (diff < closestDiff) {
        closestDiff = diff;
        closest = item;
      }
    });
    const tolerance = Math.max(1, Math.round(targetPrice * 0.005));
    if (closest && closestDiff <= tolerance) return closest;
  }

  if (pool.length === 1) return pool[0];
  if (pool.length > 0) {
    // Prefer cheapest within meal filter when list price unavailable
    return pool.reduce((best, item) => {
      const bestPrice = getOfferPrice(best.offer) ?? Number.POSITIVE_INFINITY;
      const itemPrice = getOfferPrice(item.offer) ?? Number.POSITIVE_INFINITY;
      return itemPrice < bestPrice ? item : best;
    });
  }

  return null;
}

function scoreRoomForPick(room: RoomLike, pick: ListRoomPick, selectedDate?: string | null): number {
  let score = 0;
  if (roomIdentityMatchesPick(room, pick)) score += 1000;
  if (roomNameMatchesPick(room, pick)) score += 300;

  const selectedOffer = pickBestOfferCandidate(
    collectOfferCandidates(room, pick, selectedDate ?? null),
    pick,
  );
  if (selectedOffer) score += 200;

  if (pick.roomPrice != null) {
    const candidates = collectOfferCandidates(room, pick, selectedDate ?? null);
    const prices = candidates
      .map((item) => getOfferPrice(item.offer))
      .filter((price): price is number => price != null)
      .map((price) => Math.round(price));
    if (prices.length) {
      const targetPrice = Math.round(Number(pick.roomPrice));
      const minDiff = Math.min(...prices.map((price) => Math.abs(price - targetPrice)));
      score += Math.max(0, 120 - Math.round(minDiff / 1000));
    }
  }

  return score;
}

export function resolveListSelectedOffer(
  room: RoomLike,
  pick: ListRoomPick | null | undefined,
  selectedDate: string | null,
): { mealId: string; offer: OfferLike } | null {
  if (!pick) return null;
  return pickBestOfferCandidate(collectOfferCandidates(room, pick, selectedDate), pick);
}

export function resolveListSelectedRoom(
  rooms: RoomLike[],
  pick: ListRoomPick | null | undefined,
  selectedDate?: string | null,
): RoomLike | null {
  if (!pick || !rooms.length) return null;

  const hasIdentity = Boolean(normalizePickId(pick.roomId) || normalizePickId(pick.roomListingId));
  if (hasIdentity) {
    const byIdentity = rooms.find((room) => roomIdentityMatchesPick(room, pick));
    if (byIdentity) return byIdentity;
  }

  let bestRoom: RoomLike | null = null;
  let bestScore = 0;
  rooms.forEach((room) => {
    const score = scoreRoomForPick(room, pick, selectedDate);
    if (score > bestScore) {
      bestScore = score;
      bestRoom = room;
    }
  });

  if (!bestRoom) return null;
  if (roomIdentityMatchesPick(bestRoom, pick)) return bestRoom;

  // Meal+price only matches are still useful (package list often has no room_type)
  if (bestScore < 200) return null;
  return bestRoom;
}

export function enrichListRoomPickFromRooms(
  pick: ListRoomPick | null | undefined,
  rooms: RoomLike[],
  selectedDate?: string | null,
): ListRoomPick | null | undefined {
  if (!pick) return pick;
  const room = resolveListSelectedRoom(rooms, pick, selectedDate ?? null);
  if (!room) return pick;
  const resolved = resolveListSelectedOffer(room, pick, selectedDate ?? null);
  if (!resolved) return pick;
  return {
    ...pick,
    operatorId: pick.operatorId ?? resolved.offer.operator_id,
    operatorName: pick.operatorName ?? resolved.offer.operator_name,
    // Keep search meal selection — never overwrite with a different offer meal (e.g. RO → AI).
    mealId: pick.mealId || resolved.mealId,
    offerId: pick.offerId || String(resolved.offer.id),
  };
}

function resolveMealOptionCodes(meal: RoomFilterOption): string[] {
  const codes: string[] = [];
  const idUpper = String(meal.id ?? '').toUpperCase();
  if (idUpper && MEAL_LABELS[idUpper]) codes.push(idUpper);

  const name = meal.name ? String(meal.name).trim() : '';
  if (name) {
    const nameAsCode = name.toUpperCase();
    if (MEAL_LABELS[nameAsCode]) codes.push(nameAsCode);
    const fromLabel = MEAL_NAME_TO_CODE[normalizeText(name)];
    if (fromLabel) codes.push(fromLabel);
  }

  return Array.from(new Set(codes));
}

export function applyListPickToRoomFilters(
  filters: HotelRoomFilters | null,
  pick: ListRoomPick | null | undefined,
): HotelRoomFilters | null {
  if (!filters || !pick) return filters;

  let next = filters;
  // Resolve against hotel room meal options (ids or Russian names) so search BB/RO stick.
  const mealIds = Array.from(
    new Set([
      ...resolveExactMealIdsFromPick(pick),
      ...normalizeSearchMealsToRoomCodes(pick.mealId, next.meals ?? null),
    ]),
  );
  const mealIdSet = new Set(mealIds);
  const mealLabel = normalizeText(pick.mealType);

  if (mealIds.length) {
    const existing = next.meals ?? [];
    const coveredCodes = new Set(existing.flatMap((meal) => resolveMealOptionCodes(meal)));

    // Inject search meals missing from API filter list so multi-select stays visible.
    const injected: RoomFilterOption[] = mealIds
      .filter((id) => !coveredCodes.has(id))
      .map((id) => ({
        id,
        name: MEAL_LABELS[id] || id,
        selected: true,
        disabled: false,
      }));

    const mealsBase = [...existing, ...injected];
    next = {
      ...next,
      meals: mealsBase.map((meal) => {
        const optionCodes = resolveMealOptionCodes(meal);
        const idUpper = String(meal.id).toUpperCase();
        const matches =
          mealIdSet.has(idUpper) ||
          optionCodes.some((code) => mealIdSet.has(code)) ||
          (mealIds.length === 1 &&
            mealLabel &&
            normalizeText(meal.name) === mealLabel) ||
          mealIds.some((id) => normalizeText(id) === normalizeText(meal.name));

        return matches
          ? { ...meal, selected: true, disabled: false }
          : { ...meal, selected: false };
      }),
    };
  }

  const operatorIds = resolveOperatorIdsFromPick(pick, next.operators);
  if (next.operators?.length) {
    if (operatorIds.length) {
      next = {
        ...next,
        operators: next.operators.map((operator) => ({
          ...operator,
          selected: operatorIds.includes(Number(operator.id)),
        })),
      };
    } else if (normalizePickId(pick.operatorId) || pick.operatorName) {
      // Search may send operator names / mismatched ids — try name match against room operators.
      const nameHints = [
        pick.operatorName,
        ...(String(pick.operatorId || '')
          .split(',')
          .map((part) => part.trim())
          .filter((part) => part && !Number.isFinite(Number(part)))),
      ]
        .map((value) => normalizeText(value))
        .filter(Boolean);

      if (nameHints.length) {
        next = {
          ...next,
          operators: next.operators.map((operator) => {
            const name = normalizeText(operator.name);
            const selected = nameHints.some(
              (hint) => name === hint || name.includes(hint) || hint.includes(name),
            );
            return { ...operator, selected };
          }),
        };
      }
    }
  }

  return next;
}

export function sortRoomsWithListPickFirst(
  rooms: RoomLike[],
  pick: ListRoomPick | null | undefined,
  selectedDate?: string | null,
): RoomLike[] {
  if (!pick || !rooms.length) return rooms;
  const matchedRoom = resolveListSelectedRoom(rooms, pick, selectedDate);
  if (!matchedRoom) return rooms;

  const matchedId = String(matchedRoom.ID);
  const matched: RoomLike[] = [];
  const others: RoomLike[] = [];
  rooms.forEach((room) => {
    if (String(room.ID) === matchedId) matched.push(room);
    else others.push(room);
  });
  return [...matched, ...others];
}

export function findListMatchedOfferAcrossRooms(
  rooms: RoomLike[],
  pick: ListRoomPick | null | undefined,
  selectedDate?: string | null,
): { mealId: string; offer: OfferLike; room: RoomLike } | null {
  if (!pick || !rooms.length) return null;
  const room = resolveListSelectedRoom(rooms, pick, selectedDate);
  if (!room) return null;
  const selected = resolveListSelectedOffer(room, pick, selectedDate ?? null);
  if (!selected) return null;
  return { ...selected, room };
}

export function formatListRoomOfferLabel(pick: ListRoomPick | null | undefined): string {
  if (!pick) return '';
  const mealCodes = pick.mealId
    ? String(pick.mealId)
        .split(',')
        .map((id) => id.trim())
        .filter(Boolean)
    : [];
  // Multi-meal search: always show all codes (don't let a single mealType hide the rest).
  const meal =
    mealCodes.length > 1
      ? getMealLabel(String(pick.mealId))
      : pick.mealType || (pick.mealId ? getMealLabel(String(pick.mealId)) : '') || '';
  const parts = [pick.roomType, meal].filter(Boolean);
  return parts.join(' · ');
}

/** Keep only offers whose meal code is in `mealCodes` (e.g. RO, BB). */
export function filterRoomsByMealCodes(
  rooms: RoomLike[],
  mealCodes: string[] | null | undefined,
): RoomLike[] {
  if (!rooms?.length) return [];
  const mealSet = new Set(
    (mealCodes ?? []).map((code) => String(code).trim().toUpperCase()).filter(Boolean),
  );
  if (!mealSet.size) return rooms;

  return rooms
    .map((room) => {
      const filteredOffers: Record<string, OfferLike[]> = {};
      Object.entries(room.offers ?? {}).forEach(([mealId, offerList]) => {
        if (!mealSet.has(String(mealId).toUpperCase())) return;
        if (Array.isArray(offerList) && offerList.length) {
          filteredOffers[mealId] = offerList;
        }
      });
      if (!Object.keys(filteredOffers).length) return null;
      return { ...room, offers: filteredOffers };
    })
    .filter(Boolean) as RoomLike[];
}
