/**
 * Utility functions for hotel details page
 */

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
  nights?: string;
  search_type?: string;
  flex_dates?: string;
}

export const parseSearchParamsFromQuery = (query: Record<string, string | string[] | undefined>): ParsedSearchParams | null => {
  return {
    from_city: query.from_city as string,
    from_country: query.from_country as string,
    to_country: query.to_country as string,
    to_city: query.to_city as string,
    adults: query.adults as string,
    kids: query.kids as string,
    kids_ages: query.kids_ages
      ? (Array.isArray(query.kids_ages)
          ? query.kids_ages.map(Number)
          : [Number(query.kids_ages)])
      : undefined,
    start_date: query.start_date as string,
    nights: query.nights as string,
    search_type: query.search_type as string,
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

/**
 * Formats nights as range when flex_dates is enabled.
 * Example: 7 with flex_dates=2 becomes "7..9"
 */
const formatNightsForAPI = (nightsStr: string, flexDates: number): string => {
  const nights = parseNightsValue(nightsStr);
  return flexDates > 0 
    ? `${nights}..${nights + flexDates}`
    : nights.toString();
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
  const flexDates = query.flex_dates ? Number(query.flex_dates) : 2;
  
  // Calculate end date - use parseNightsValue to correctly handle "7..9" format
  const startDateObj = new Date(startDate);
  const endDateObj = new Date(startDateObj);
  const nights = parseNightsValue(nightsStr);
  endDateObj.setDate(startDateObj.getDate() + nights);
  
  const formatDate = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

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
    end_date_till: formatDate(endDateObj),
    nights: formatNightsForAPI(nightsStr, flexDates), // Format as range when flex_dates > 0
    search_type: (query.search_type as string) || 'package',
    flex_dates: flexDates,
    hotel_ids: [Number(hotelId)],
    page_number: 1,
    page_limit: 20,
    sort_by: (query.sort_by as string) || 'relevance',
  };
};

/**
 * Validates hotel ID
 */
export const parseHotelId = (hotelId: string | undefined): number | null => {
  if (!hotelId) return null;
  const parsed = parseInt(hotelId, 10);
  return isNaN(parsed) ? null : parsed;
};

