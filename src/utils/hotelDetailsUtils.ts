/**
 * Utility functions for hotel details page
 */

import { endYmdAfterNights } from '@/utils/calendarDateRange';

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

export const parseSearchParamsFromQuery = (query: Record<string, string | string[] | undefined>): ParsedSearchParams | null => {
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
    flex_dates: query.flex_dates
      ? (typeof query.flex_dates === 'string' ? query.flex_dates : String(query.flex_dates))
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
  startDate: string
): any | null => {
  if (!rooms?.length || !startDate) return null;
  let best: any = null;
  let bestPrice = Infinity;

  rooms.forEach((room) => {
    const offers = room?.offers || {};
    Object.values(offers).forEach((offerList: any) => {
      if (!Array.isArray(offerList)) return;
      offerList.forEach((offer: any) => {
        if (offer?.start_date !== startDate) return;
        const price = Number(offer.analytics_price);
        const p = Number.isFinite(price) ? price : Infinity;
        if (p < bestPrice) {
          bestPrice = p;
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
  const flexDates = 2;

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
    nights: formatNightsForAPI(nights, flexDates),
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
  // Hotel details room search must always use ±2 nights.
  const flexDates = 2;
  
  const nights = parseNightsValue(nightsStr);
  const endDateStr = endYmdAfterNights(startDate, nights);

  return {
    from_city: (query.from_city as string) || 'Moscow',
    from_country: (query.from_country as string) || 'RU',
    to_country: (query.to_country as string) || 'RU',
    to_city: query.to_city === 'null' || query.to_city === '' ? undefined : (query.to_city as string),
    adults: (query.adults as string) || '2',
    kids: query.kids as string,
    kids_ages: query.kids_ages 
      ? (Array.isArray(query.kids_ages) ? query.kids_ages.map(Number) : [Number(query.kids_ages)])
      : undefined,
    start_date: startDate,
    start_date_from: startDate,
    end_date_till: endDateStr,
    nights: formatNightsForAPIFromString(nightsStr, flexDates), // Format as range when flex_dates > 0
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
    flex_dates: "2",
  };
  const built = buildInitialSearchParams(base, String(hotelId));
  const out: Record<string, string> = {
    hotel_id: String(hotelId),
    from_city: String(built.from_city),
    from_country: String(built.from_country),
    to_country: String(built.to_country ?? ""),
    adults: String(built.adults),
    start_date: String(built.start_date),
    start_date_from: String(built.start_date_from),
    end_date_till: String(built.end_date_till),
    nights: String(built.nights),
    search_type: String(built.search_type),
    flex_dates: String(built.flex_dates),
  };
  if (built.to_city != null && String(built.to_city)) {
    out.to_city = String(built.to_city);
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

