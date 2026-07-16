/**
 * Utility functions for hotel details page
 *
 * ±2 flex dates/nights (flex_dates=2, departure ±2 days, nights 7..9):
 * DISABLED on website — fixed date and exact nights only.
 * Search commented blocks with "±flex" to re-enable.
 */

import { endYmdAfterNights /* , listFlexDepartureDates */ } from '@/utils/calendarDateRange';
import { getSearchTypeFromQuery } from '@/utils/bookingFlowUtils';

/**
 * Gets default start date (7 days from today) in YYYY-MM-DD format
 */
export const getDefaultStartDate = (): string => {
  const today = new Date();
  const plus7 = new Date(today);
  plus7.setDate(today.getDate() + 7);
  const year = plus7.getFullYear();
  const month = String(plus7.getMonth() + 1).padStart(2, '0');
  const day = String(plus7.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

/**
 * Parses search parameters from Next.js router query
 */
export interface ParsedSearchParams {
  from_city?: string;
  from_country?: string;
  to_country?: string;
  to_city?: string;
  adults?: string;
  kids?: string;
  kids_ages?: number[];
  start_date?: string;
  end_date_till?: string;
  nights?: string;
  search_type?: string;
  flex_dates?: string;
}

function queryParam(
  query: Record<string, string | string[] | undefined>,
  key: string,
): string | undefined {
  const value = query[key];
  if (Array.isArray(value)) return value[0];
  return value;
}

export function normalizeQueryDate(value: unknown): string | undefined {
  if (value == null || value === '') return undefined;
  const raw = Array.isArray(value) ? value[0] : value;
  const s = String(raw).trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
  const parsed = new Date(s);
  if (Number.isNaN(parsed.getTime())) return undefined;
  const year = parsed.getFullYear();
  const month = String(parsed.getMonth() + 1).padStart(2, '0');
  const day = String(parsed.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export const parseSearchParamsFromQuery = (
  query: Record<string, string | string[] | undefined>,
  options?: NightsConstraintOptions,
): ParsedSearchParams | null => {
  const defaultFlex = options?.defaultFlexDates;
  const flexRaw = query.flex_dates
    ? (typeof query.flex_dates === 'string' ? query.flex_dates : String(query.flex_dates))
    : undefined;

  return {
    from_city: queryParam(query, 'from_city'),
    from_country: queryParam(query, 'from_country'),
    to_country: queryParam(query, 'to_country'),
    to_city: queryParam(query, 'to_city'),
    adults: queryParam(query, 'adults'),
    kids: queryParam(query, 'kids'),
    kids_ages: query.kids_ages
      ? (Array.isArray(query.kids_ages)
          ? query.kids_ages.map(Number)
          : [Number(query.kids_ages)])
      : undefined,
    start_date: queryParam(query, 'start_date'),
    end_date_till: queryParam(query, 'end_date_till'),
    nights: queryParam(query, 'nights'),
    search_type: queryParam(query, 'search_type'),
    flex_dates:
      flexRaw != null && flexRaw !== ''
        ? flexRaw
        : defaultFlex != null
          ? String(defaultFlex)
          : undefined,
  };
};

/**
 * Parses nights value from string, handling both "7" and "7..9" formats
 * Returns the base number of nights (first number in range)
 */
export const parseNightsValue = (nightsStr: string): number => {
  if (!nightsStr) return 7;
  // Handle "7..9" format - extract first number
  const match = nightsStr.match(/^(\d+)/);
  if (match) {
    return parseInt(match[1], 10) || 7;
  }
  // Fallback: try to parse as number
  const parsed = parseInt(nightsStr, 10);
  return isNaN(parsed) ? 7 : parsed;
};

export function getSearchNightsFromQuery(
  query: Record<string, string | string[] | undefined>,
): number | null {
  const nightsRaw = Array.isArray(query.nights) ? query.nights[0] : query.nights;
  if (!nightsRaw) return null;
  const parsed = parseNightsValue(String(nightsRaw));
  return parsed > 0 ? parsed : null;
}

export function parseNightsRange(nightsStr: string): { min: number; max: number } {
  const rangeMatch = nightsStr.match(/^(\d+)\.\.(\d+)$/);
  if (rangeMatch) {
    const min = parseInt(rangeMatch[1], 10);
    const max = parseInt(rangeMatch[2], 10);
    if (Number.isFinite(min) && Number.isFinite(max)) {
      return { min: Math.min(min, max), max: Math.max(min, max) };
    }
  }

  const single = parseNightsValue(nightsStr);
  return { min: single, max: single };
}

/** Hotel details page: ±2 nights/dates disabled — use exact date only (was 2). */
export const HOTEL_DETAILS_DEFAULT_FLEX_DATES = 0;
// export const HOTEL_DETAILS_DEFAULT_FLEX_DATES = 2; // ±2 flex window

export function parseFlexDatesValue(
  value: unknown,
  defaultWhenMissing = 0,
): number {
  if (value == null || value === '') return defaultWhenMissing;
  const parsed = parseInt(String(value), 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
}

function getFlexDatesFromQuery(
  query: Record<string, string | string[] | undefined>,
  defaultWhenMissing = 0,
): number {
  const flexRaw = Array.isArray(query.flex_dates) ? query.flex_dates[0] : query.flex_dates;
  return parseFlexDatesValue(flexRaw, defaultWhenMissing);
}

export function getSearchNightsRangeFromQuery(
  query: Record<string, string | string[] | undefined>,
  defaultFlexDates = 0,
): { min: number; max: number } | null {
  const nightsRaw = Array.isArray(query.nights) ? query.nights[0] : query.nights;
  if (!nightsRaw) return null;

  const nightsStr = String(nightsRaw);
  if (/^\d+\.\.\d+$/.test(nightsStr)) {
    return parseNightsRange(nightsStr);
  }

  const baseNights = parseNightsValue(nightsStr);
  // ±flex_dates nights range (disabled — exact nights only)
  // const flexDates = getFlexDatesFromQuery(query, defaultFlexDates);
  // if (flexDates > 0) {
  //   return { min: baseNights, max: baseNights + flexDates };
  // }

  return { min: baseNights, max: baseNights };
}

export function offerMatchesSearchNights(
  offer: { nights_count?: number | string | null },
  searchNights: number | null,
  nightsRange?: { min: number; max: number } | null,
): boolean {
  const nights = Number(offer?.nights_count);

  if (!Number.isFinite(nights)) {
    return searchNights == null && !nightsRange;
  }

  if (nightsRange) {
    return nights >= nightsRange.min && nights <= nightsRange.max;
  }

  if (searchNights == null) return true;
  return nights === searchNights;
}

/** Match only the exact nights from the search request (ignores flex_dates range). */
export function matchesExactSearchNights(
  offer: { nights_count?: number | string | null },
  searchNights: number | null,
): boolean {
  return offerMatchesSearchNights(offer, searchNights, null);
}

export type NightsConstraint = {
  searchNights: number | null;
  nightsRange: { min: number; max: number } | null;
};

export type NightsConstraintOptions = {
  /** Applied when `flex_dates` is missing from the query (hotel page uses 2). */
  defaultFlexDates?: number;
};

/** Room display matches nights + flex_dates from the URL (exact or range). */
export function getNightsConstraintFromQuery(
  query: Record<string, string | string[] | undefined>,
  options?: NightsConstraintOptions,
): NightsConstraint {
  const defaultFlex = options?.defaultFlexDates ?? 0;
  const searchNights = getSearchNightsFromQuery(query);
  const nightsRange = getSearchNightsRangeFromQuery(query, defaultFlex);
  return { searchNights, nightsRange };
}

export function offerMatchesNightsConstraint(
  offer: { nights_count?: number | string | null },
  constraint: NightsConstraint,
): boolean {
  return offerMatchesSearchNights(offer, constraint.searchNights, constraint.nightsRange);
}

export function filterRoomsByNightsConstraint(
  rooms: unknown[] | null | undefined,
  constraint: NightsConstraint,
): unknown[] {
  return filterRoomsByOfferNights(rooms, constraint.searchNights, constraint.nightsRange);
}

/** Keep only offers that match the nights constraint. */
export function filterRoomsByOfferNights(
  rooms: unknown[] | null | undefined,
  searchNights: number | null,
  nightsRange?: { min: number; max: number } | null,
): unknown[] {
  if (!rooms?.length) return [];
  if (searchNights == null && !nightsRange) return rooms;

  return rooms
    .map((room) => {
      const roomRecord = room as { offers?: Record<string, unknown[]> };
      const filteredOffers: Record<string, unknown[]> = {};

      Object.entries(roomRecord.offers ?? {}).forEach(([mealType, offerList]) => {
        const offers = (offerList ?? []).filter((offer) =>
          offerMatchesSearchNights(
            offer as { nights_count?: number | string | null },
            searchNights,
            nightsRange ?? null,
          ),
        );

        if (offers.length > 0) {
          filteredOffers[mealType] = offers;
        }
      });

      if (Object.keys(filteredOffers).length === 0) return null;
      return { ...roomRecord, offers: filteredOffers };
    })
    .filter(Boolean);
}

export function getOfferPriceValue(offer: {
  analytics_price?: number | string | null;
  price?: number | string | null;
}): number | null {
  const value = Number(offer.analytics_price ?? offer.price);
  return Number.isFinite(value) ? value : null;
}

/** Collect sorted start dates from room offers that match the nights constraint. */
export function getAvailableDatesFromFilteredRooms(
  rooms: unknown[] | null | undefined,
  searchNights: number | null,
  nightsRange?: { min: number; max: number } | null,
): string[] {
  const dates = new Set<string>();

  rooms?.forEach((room) => {
    const offers = (room as { offers?: Record<string, unknown[]> })?.offers ?? {};
    Object.values(offers).forEach((offerList) => {
      if (!Array.isArray(offerList)) return;
      offerList.forEach((offer) => {
        const record = offer as { start_date?: string; nights_count?: number | string | null };
        if (!record.start_date) return;
        if (!offerMatchesSearchNights(record, searchNights, nightsRange)) return;
        dates.add(String(record.start_date));
      });
    });
  });

  return Array.from(dates).sort((a, b) => new Date(a).getTime() - new Date(b).getTime());
}

export function getSearchStartDateFromQuery(
  query: Record<string, string | string[] | undefined>,
): string | null {
  return normalizeQueryDate(queryParam(query, 'start_date')) ?? null;
}

/** Departure dates in the ±flex_dates window from the URL search date. */
export function getFlexDepartureDatesFromQuery(
  query: Record<string, string | string[] | undefined>,
  defaultFlexDates = 0,
): string[] {
  const startDate = getSearchStartDateFromQuery(query);
  if (!startDate) return [];
  // ±flex_dates window (disabled — fixed departure date only)
  // const flex = getFlexDatesFromQuery(query, defaultFlexDates);
  // return listFlexDepartureDates(startDate, flex);
  return [startDate];
}

/**
 * Room date tabs: fixed departure date only (±flex_dates window disabled).
 */
export function getAvailableDepartureDatesForHotelRooms(
  rooms: unknown[] | null | undefined,
  query: Record<string, string | string[] | undefined>,
  defaultFlexDates = HOTEL_DETAILS_DEFAULT_FLEX_DATES,
  overrides?: { startDate?: string | null; flexDates?: number },
): string[] {
  const startDate = overrides?.startDate ?? getSearchStartDateFromQuery(query);
  const constraint = getNightsConstraintFromQuery(query, { defaultFlexDates: 0 });
  const datesFromRooms = getAvailableDatesFromFilteredRooms(
    rooms,
    constraint.searchNights,
    constraint.nightsRange,
  );

  // Prefer real offer dates from API so all rooms stay visible after refresh.
  if (datesFromRooms.length > 0) {
    return datesFromRooms;
  }

  // ±flex_dates date tabs (disabled — fixed departure fallback)
  // const flex =
  //   overrides?.flexDates ??
  //   getFlexDatesFromQuery(query, defaultFlexDates);
  // if (startDate && flex > 0) {
  //   return listFlexDepartureDates(startDate, flex);
  // }

  if (startDate) {
    return [startDate];
  }

  return [];
}

/** Cheapest offer price per start date (undefined when no matching offers). */
export function buildMinOfferPricesByDate(
  rooms: unknown[] | null | undefined,
  dates: string[],
  searchNights: number | null,
  nightsRange?: { min: number; max: number } | null,
): Record<string, number | undefined> {
  const dateSet = new Set(dates);
  const grouped: Record<string, number | undefined> = {};
  dates.forEach((date) => {
    grouped[date] = undefined;
  });

  rooms?.forEach((room) => {
    const offers = (room as { offers?: Record<string, unknown[]> })?.offers ?? {};
    Object.values(offers).forEach((offerList) => {
      if (!Array.isArray(offerList)) return;
      offerList.forEach((offer) => {
        const record = offer as {
          start_date?: string;
          nights_count?: number | string | null;
          analytics_price?: number;
          price?: number;
        };
        const { start_date } = record;
        if (!start_date || !dateSet.has(start_date)) return;
        if (!offerMatchesSearchNights(record, searchNights, nightsRange)) return;

        const offerPrice = getOfferPriceValue(record);
        if (offerPrice == null) return;

        const current = grouped[start_date];
        if (current === undefined || offerPrice < current) {
          grouped[start_date] = offerPrice;
        }
      });
    });
  });

  return grouped;
}

/** All distinct offer start_date values from room list, sorted ascending */
export const getAvailableStartDatesFromRooms = (rooms: any[] | undefined | null): string[] => {
  const set = new Set<string>();
  rooms?.forEach((room) => {
    const offers = room?.offers || {};
    Object.values(offers).forEach((offerList: any) => {
      if (!Array.isArray(offerList)) return;
      offerList.forEach((offer: any) => {
        if (offer?.start_date) set.add(String(offer.start_date));
      });
    });
  });
  return Array.from(set).sort((a, b) => new Date(a).getTime() - new Date(b).getTime());
};

/** Cheapest offer (by analytics_price) for a given start_date across all rooms */
export const findCheapestOfferForStartDate = (
  rooms: any[] | undefined | null,
  startDate: string,
  nightsCount?: number | null,
  nightsRange?: { min: number; max: number } | null,
  /** When set, only consider these meal codes (e.g. RO, AI) — keeps header in sync with search filters. */
  mealIds?: string[] | null,
): any | null => {
  if (!rooms?.length || !startDate) return null;
  let best: any = null;
  let bestPrice = Infinity;
  const mealSet =
    mealIds?.length
      ? new Set(mealIds.map((id) => String(id).toUpperCase()))
      : null;

  rooms.forEach((room) => {
    const offers = room?.offers || {};
    Object.entries(offers).forEach(([mealType, offerList]: [string, any]) => {
      if (mealSet && !mealSet.has(String(mealType).toUpperCase())) return;
      if (!Array.isArray(offerList)) return;
      offerList.forEach((offer: any) => {
        if (offer?.start_date !== startDate) return;
        if (!offerMatchesSearchNights(offer, nightsCount ?? null, nightsRange)) return;
        const price = getOfferPriceValue(offer);
        if (price == null) return;
        if (price < bestPrice) {
          bestPrice = price;
          best = offer;
        }
      });
    });
  });

  return best;
};

/**
 * Formats nights as range when flex_dates is enabled.
 * Example: 7 with flex_dates=2 becomes "7..9"
 */
export const formatNightsForAPI = (nights: number | string, flexDates: number): string => {
  const base = typeof nights === 'number' ? nights : parseNightsValue(nights);
  return flexDates > 0
    ? `${base}..${base + flexDates}`
    : String(base);
};

/**
 * Builds start-search params for the hotel details form (defaults + URL + user edits).
 */
export function buildHotelSearchParamsFromForm(
  hotelId: string,
  source: {
    query?: ParsedSearchParams | null;
    apiHotelData?: {
      country?: { iso2?: string };
      city?: { name_en?: string; name_ru?: string; name?: string };
    } | null;
    departureDate?: string;
    returnDate?: string;
    nights?: number;
    adults?: number;
    kids?: number;
    kidsAges?: number[];
    flexDates?: number;
  },
): Record<string, unknown> | null {
  const parsedHotelId = parseHotelId(hotelId);
  if (!parsedHotelId) return null;

  const q = source.query || {};
  const departureDate =
    normalizeQueryDate(source.departureDate) ||
    normalizeQueryDate(q.start_date) ||
    getDefaultStartDate();
  const nights =
    source.nights && source.nights > 0
      ? source.nights
      : parseNightsValue(String(q.nights ?? ''));
  const returnDate =
    normalizeQueryDate(source.returnDate) ||
    normalizeQueryDate(q.end_date_till) ||
    endYmdAfterNights(departureDate, nights);
  const adults =
    source.adults && source.adults >= 1
      ? source.adults
      : parseInt(String(q.adults || '2'), 10) || 2;
  const kids = source.kids ?? (parseInt(String(q.kids || '0'), 10) || 0);
  // ±flex_dates / nights range (disabled — exact nights only)
  // const flexDates =
  //   source.flexDates != null
  //     ? source.flexDates
  //     : parseFlexDatesValue(q.flex_dates, HOTEL_DETAILS_DEFAULT_FLEX_DATES);
  const flexDates = 0;

  const hotelCountry = source.apiHotelData?.country;
  const hotelCity = source.apiHotelData?.city;

  const toCountry =
    (q.to_country && String(q.to_country).trim()) ||
    hotelCountry?.iso2 ||
    'RU';

  const toCity =
    (q.to_city && q.to_city !== 'null' && String(q.to_city).trim()) ||
    hotelCity?.name_en ||
    hotelCity?.name_ru ||
    hotelCity?.name ||
    undefined;

  const searchParams: Record<string, unknown> = {
    from_city: q.from_city || 'Moscow',
    from_country: q.from_country || 'RU',
    to_country: toCountry,
    to_city: toCity,
    search_type: q.search_type || 'package',
    flex_dates: flexDates,
    start_date: departureDate,
    start_date_from: departureDate,
    end_date_till: returnDate,
    nights: String(nights),
    // nights: formatNightsForAPI(nights, flexDates), // ±2 range when flex enabled
    adults: String(adults),
    kids: kids > 0 ? String(kids) : undefined,
    kids_ages:
      kids > 0
        ? (source.kidsAges?.length ? source.kidsAges : q.kids_ages)
        : undefined,
    hotel_ids: [parsedHotelId],
    page_number: 1,
    page_limit: 20,
    sort_by: 'relevance',
  };

  const requiredFields = ['from_city', 'from_country', 'to_country', 'start_date', 'nights', 'adults', 'search_type'];
  const isValid = requiredFields.every((field) => searchParams[field]);
  return isValid ? searchParams : null;
}

/**
 * Formats nights as range when flex_dates is enabled (legacy helper for URL builder).
 */
const formatNightsForAPIFromString = (nightsStr: string, flexDates: number): string => {
  return formatNightsForAPI(nightsStr, flexDates);
};

/**
 * Builds search parameters object from query for initial search
 */
export const buildInitialSearchParams = (
  query: Record<string, string | string[] | undefined>,
  hotelId: string
): Record<string, unknown> => {
  const startDate = (query.start_date as string) || getDefaultStartDate();
  const nightsStr = (query.nights as string) || '7';
  // const flexDates = getFlexDatesFromQuery(query, HOTEL_DETAILS_DEFAULT_FLEX_DATES);
  const flexDates = 0;
  
  const nights = parseNightsValue(nightsStr);
  const endDateStr = endYmdAfterNights(startDate, nights);

  return {
    from_city: (query.from_city as string) || 'Moscow',
    from_country: (query.from_country as string) || 'RU',
    to_country: query.to_country && String(query.to_country).trim()
      ? (query.to_country as string)
      : undefined,
    to_city: query.to_city === 'null' || query.to_city === '' ? undefined : (query.to_city as string),
    adults: (query.adults as string) || '2',
    kids: query.kids as string,
    kids_ages: query.kids_ages 
      ? (Array.isArray(query.kids_ages) ? query.kids_ages.map(Number) : [Number(query.kids_ages)])
      : undefined,
    start_date: startDate,
    start_date_from: startDate,
    end_date_till: endDateStr,
    nights: String(nights),
    // nights: formatNightsForAPIFromString(nightsStr, flexDates),
    search_type: (query.search_type as string) || 'package',
    flex_dates: flexDates,
    hotel_ids: [Number(hotelId)],
    page_number: 1,
    page_limit: 20,
    sort_by: (query.sort_by as string) || 'relevance',
  };
};

/** Default search query for `/hotel-details` (favorites, shared links) — matches `buildInitialSearchParams` defaults. */
export function buildHotelDetailsDeepLinkQuery(hotelId: string | number): Record<string, string> {
  const base: Record<string, string | string[] | undefined> = {
    from_city: "Moscow",
    from_country: "RU",
    to_country: "",
    adults: "2",
    start_date: getDefaultStartDate(),
    nights: "7",
    search_type: "package",
    // flex_dates: "2", // ±2 dates disabled
    flex_dates: "0",
  };
  const built = buildInitialSearchParams(base, String(hotelId));
  const out: Record<string, string> = {
    hotel_id: String(hotelId),
    from_city: String(built.from_city),
    from_country: String(built.from_country),
    adults: String(built.adults),
    start_date: String(built.start_date),
    start_date_from: String(built.start_date_from),
    end_date_till: String(built.end_date_till),
    nights: String(parseNightsValue(String(base.nights ?? '7'))),
    search_type: String(built.search_type),
    flex_dates: String(built.flex_dates),
  };
  if (built.to_city != null && String(built.to_city)) {
    out.to_city = String(built.to_city);
  }
  if (built.to_country != null && String(built.to_country)) {
    out.to_country = String(built.to_country);
  }
  if (built.kids != null) {
    out.kids = String(built.kids);
  }
  return out;
}

/**
 * Validates hotel ID
 */
export const parseHotelId = (hotelId: string | undefined): number | null => {
  if (!hotelId) return null;
  const parsed = parseInt(hotelId, 10);
  return isNaN(parsed) ? null : parsed;
};

function parseOptionalNumber(value: unknown): number | null {
  if (value == null || value === '') return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

/** Merge reviews/rating from hotel info, URL, search results, and reviews API. */
export function resolveHotelDisplayMeta(
  hotel: Record<string, unknown> | null | undefined,
  options: {
    queryReviewsCount?: unknown;
    queryRating?: unknown;
    searchHotelItem?: { hotel?: { reviews_count?: number; rating?: number } } | null;
    reviewsApiRating?: number | null;
    loadedReviewsCount?: number;
  } = {},
): { reviews_count: number; rating: number } {
  const queryReviews = parseOptionalNumber(options.queryReviewsCount);
  const queryRating = parseOptionalNumber(options.queryRating);
  const searchReviews = parseOptionalNumber(options.searchHotelItem?.hotel?.reviews_count);
  const searchRating = parseOptionalNumber(options.searchHotelItem?.hotel?.rating);
  const hotelReviews = parseOptionalNumber(hotel?.reviews_count ?? hotel?.reviews);
  const hotelRating = parseOptionalNumber(hotel?.rating);

  const reviews_count =
    hotelReviews ??
    queryReviews ??
    searchReviews ??
    (options.loadedReviewsCount && options.loadedReviewsCount > 0
      ? options.loadedReviewsCount
      : 0);

  const rating =
    hotelRating ??
    queryRating ??
    searchRating ??
    options.reviewsApiRating ??
    0;

  return { reviews_count, rating };
}

