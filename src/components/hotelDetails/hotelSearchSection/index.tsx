import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { startSearch } from '@/api/levelTravelApi';
import SelectDate from '@/components/search/date';
import Nights from '@/components/search/nights';
import People from '@/components/search/people';
import Button from '@/components/UI/button';
import { parseNightsValue } from '@/utils/hotelDetailsUtils';
import { differenceCalendarDaysBetweenYmd, endYmdAfterNights } from '@/utils/calendarDateRange';
import styles from './hotelSearchSection.module.css';

// ============================================================================
// Types
// ============================================================================

interface ApiHotelData {
  country?: {
    iso2?: string;
  };
  city?: {
    name_en?: string;
    name_ru?: string;
  };
}

interface SearchParamsSnapshot {
  startDateISO: string;
  nights: number;
  adults: number;
  kids: number;
  kidsAges: number[];
}

interface InitialSearchParams {
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
  flex_dates?: string | number;
}

interface HotelSearchSectionProps {
  hotelId: string | null;
  apiHotelData?: ApiHotelData | null;
  onSearchComplete?: (requestId: string) => void;
  onParamsChange?: (snapshot: SearchParamsSnapshot) => void;
  initialSearchParams?: InitialSearchParams | null;
  runStart?: boolean;
}

interface SearchParamsState {
  departureDate: string;
  /** Checkout / return date from calendar; nights slider does not overwrite until changed */
  returnDate: string;
  nights: number;
  adults: number;
  kids: number;
  kidsAges: number[];
}

// ============================================================================
// Constants & Helpers
// ============================================================================

const DEFAULT_NIGHTS = 7;
const DEFAULT_ADULTS = 2;
const DEFAULT_KIDS = 0;
const DEFAULT_FLEX_DATES = 2;
const DEFAULT_FROM_CITY = 'Moscow';
const DEFAULT_FROM_COUNTRY = 'RU';
const DEFAULT_SEARCH_TYPE = 'package';


/**
 * Formats a Date object to YYYY-MM-DD string format.
 */
const formatDateToISO = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

/**
 * Gets default start date (7 days from today) in YYYY-MM-DD format.
 */
const getDefaultStartDate = (): string => {
  const today = new Date();
  const plus7 = new Date(today);
  plus7.setDate(today.getDate() + 7);
  return formatDateToISO(plus7);
};

/**
 * Converts various date formats to YYYY-MM-DD string.
 */
const normalizeDate = (date: Date | string): string | null => {
  if (date instanceof Date) {
    return formatDateToISO(date);
  }
  
  if (typeof date === 'string') {
    // Already in ISO format
    if (date.match(/^\d{4}-\d{2}-\d{2}$/)) {
      return date;
    }
    
    // Try to parse and format
    const parsed = new Date(date);
    if (!isNaN(parsed.getTime())) {
      return formatDateToISO(parsed);
    }
  }
  
  return null;
};

const endDateISOFromDepartureAndNights = (departureISO: string, nights: number): string =>
  endYmdAfterNights(departureISO, nights);

/**
 * Formats nights as range when flex_dates is enabled.
 * Example: 7 with flex_dates=2 becomes "7..9"
 */
const formatNightsForAPI = (nights: number, flexDates: number): string => {
  return flexDates > 0 
    ? `${nights}..${nights + flexDates}`
    : nights.toString();
};

const nightsBetweenIsoOrFallback = (startIso: string, endIso: string, fallback: number): number => {
  const d = differenceCalendarDaysBetweenYmd(startIso, endIso);
  if (d == null || d < 1) return Math.max(1, fallback);
  return d;
};

// ============================================================================
// Component
// ============================================================================

const HotelSearchSection: React.FC<HotelSearchSectionProps> = ({
  hotelId,
  apiHotelData,
  onSearchComplete,
  onParamsChange,
  initialSearchParams,
  runStart = false,
}) => {
  // ==========================================================================
  // State
  // ==========================================================================
  
  const [isSearching, setIsSearching] = useState(false);
  const [hasUserChangedParams, setHasUserChangedParams] = useState(false);
  
  const sourceParams = useMemo(
    () => initialSearchParams || null,
    [initialSearchParams]
  );

  // Initialize form state from sourceParams or defaults
  const [params, setParams] = useState<SearchParamsState>(() => {
    const initNights = parseNightsValue(String(sourceParams?.nights ?? ''));
    const initDep = sourceParams?.start_date || getDefaultStartDate();
    return {
      departureDate: initDep,
      returnDate: endDateISOFromDepartureAndNights(initDep, initNights),
      nights: initNights,
      adults: parseInt(sourceParams?.adults || String(DEFAULT_ADULTS), 10),
      kids: parseInt(sourceParams?.kids || String(DEFAULT_KIDS), 10),
      kidsAges: sourceParams?.kids_ages || [],
    };
  });

  // ==========================================================================
  // Effects
  // ==========================================================================

  // Sync params with sourceParams when they change externally
  // Only syncs if user hasn't made manual changes
  useEffect(() => {
    if (!sourceParams?.start_date || hasUserChangedParams) return;

    const nights = parseNightsValue(String(sourceParams.nights ?? ''));
    const newParams = {
      departureDate: sourceParams.start_date,
      nights,
      returnDate: endDateISOFromDepartureAndNights(sourceParams.start_date, nights),
      adults: parseInt(sourceParams.adults || String(DEFAULT_ADULTS), 10),
      kids: parseInt(sourceParams.kids || String(DEFAULT_KIDS), 10),
      kidsAges: sourceParams.kids_ages || [],
    };

    setParams(prev => {
      // Skip update if values haven't changed
      const hasChanged = 
        prev.departureDate !== newParams.departureDate ||
        prev.returnDate !== newParams.returnDate ||
        prev.nights !== newParams.nights ||
        prev.adults !== newParams.adults ||
        prev.kids !== newParams.kids ||
        JSON.stringify(prev.kidsAges) !== JSON.stringify(newParams.kidsAges);

      return hasChanged ? newParams : prev;
    });
  }, [sourceParams, hasUserChangedParams]);

  // Notify parent of param changes
  useEffect(() => {
    if (onParamsChange && params.departureDate) {
      onParamsChange({
        startDateISO: params.departureDate,
        nights: params.nights,
        adults: params.adults,
        kids: params.kids,
        kidsAges: params.kidsAges,
      });
    }
  }, [params, onParamsChange]);

  // Auto-trigger search when runStart is true
  useEffect(() => {
    if (runStart) {
      handleSearch();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [runStart]);

  // ==========================================================================
  // Handlers
  // ==========================================================================

  const updateParams = useCallback((updates: Partial<SearchParamsState>) => {
    setHasUserChangedParams(true);
    setParams(prev => ({ ...prev, ...updates }));
  }, []);

  const handleDateChange = useCallback((date: Date | string) => {
    const normalized = normalizeDate(date);
    if (!normalized) return;
    setHasUserChangedParams(true);
    setParams((prev) => ({
      ...prev,
      departureDate: normalized,
      returnDate: endDateISOFromDepartureAndNights(normalized, prev.nights),
    }));
  }, []);

  const handleNightsChange = useCallback((nightsInput: string | number) => {
    let nightsValue: number;
    
    if (typeof nightsInput === 'number') {
      nightsValue = nightsInput;
    } else if (typeof nightsInput === 'string') {
      // Extract first number from range format (e.g., "7..9" -> 7)
      const cleaned = nightsInput.includes('..')
        ? nightsInput.split('..')[0].replace(/\D/g, '')
        : nightsInput.replace(/\D/g, '');
      nightsValue = cleaned ? parseInt(cleaned, 10) : DEFAULT_NIGHTS;
    } else {
      return;
    }
    
    setHasUserChangedParams(true);
    setParams((prev) => ({
      ...prev,
      nights: nightsValue,
      returnDate: endDateISOFromDepartureAndNights(prev.departureDate, nightsValue),
    }));
  }, []);

  const handleDateFieldChange = useCallback((
    value: Date | string | number | { start: string; end: string },
    key: string
  ) => {
    if (key === 'sync_nights_from_dates') {
      const n = typeof value === 'number' ? value : parseInt(String(value), 10);
      if (!Number.isFinite(n) || n < 1) return;
      setHasUserChangedParams(true);
      setParams((prev) => ({
        ...prev,
        nights: n,
        returnDate: endYmdAfterNights(prev.departureDate, n),
      }));
      return;
    }
    if (key === 'date_range' && typeof value === 'object' && value !== null && 'start' in value && 'end' in value) {
      const dr = value as { start: string; end: string };
      updateParams({
        departureDate: dr.start,
        returnDate: dr.end,
      });
      return;
    }
    if (key === 'form_date') {
      handleDateChange(value as Date | string);
      return;
    }
    if (key === 'nights') {
      handleNightsChange(value as string | number);
    }
  }, [handleDateChange, handleNightsChange, updateParams]);

  const handleTouristsChange = useCallback((
    value: string | number | { kids: string; kids_ages: number[] },
    key: string
  ) => {
    if (key === 'adults') {
      const adultsValue = typeof value === 'number' 
        ? value 
        : parseInt(value as string, 10);
      updateParams({ adults: adultsValue });
    } else if (key === 'kids') {
      if (typeof value === 'object' && value !== null) {
        updateParams({
          kids: parseInt(value.kids || '0', 10),
          kidsAges: value.kids_ages || [],
        });
      } else {
        updateParams({
          kids: typeof value === 'number' ? value : parseInt(value as string, 10),
          kidsAges: [],
        });
      }
    }
  }, [updateParams]);

  // ==========================================================================
  // Search Logic
  // ==========================================================================

  const buildSearchParams = useCallback((): Record<string, unknown> | null => {
    // Validate required parameters
    if (!params.departureDate || !params.returnDate || params.nights <= 0 || params.adults < 1) {
      return null;
    }

    const parsedHotelId = hotelId ? parseInt(hotelId, 10) : null;
    if (!parsedHotelId || isNaN(parsedHotelId)) {
      return null;
    }

    // Date range: explicit return from calendar; nights stay as set on the nights control
    const startDateISO = params.departureDate;

    // Get hotel location data
    const hotelCountry = apiHotelData?.country;
    const hotelCity = apiHotelData?.city;

    // Hotel page should always search with ±2 nights flexibility.
    const flexDates = DEFAULT_FLEX_DATES;
    const nightsFromDates = nightsBetweenIsoOrFallback(
      params.departureDate,
      params.returnDate,
      params.nights
    );
    const nightsFormatted = formatNightsForAPI(nightsFromDates, flexDates);

    const toCountry =
      (sourceParams?.to_country && String(sourceParams.to_country).trim()) ||
      hotelCountry?.iso2 ||
      'RU';

    // Build search parameters
    const searchParams: Record<string, unknown> = {
      from_city: sourceParams?.from_city || DEFAULT_FROM_CITY,
      from_country: sourceParams?.from_country || DEFAULT_FROM_COUNTRY,
      to_country: toCountry,
      to_city: sourceParams?.to_city || hotelCity?.name_en || hotelCity?.name_ru || undefined,
      search_type: sourceParams?.search_type || DEFAULT_SEARCH_TYPE,
      flex_dates: flexDates,
      start_date: startDateISO,
      start_date_from: startDateISO,
      end_date_till: params.returnDate,
      nights: nightsFormatted,
      adults: params.adults.toString(),
      kids: params.kids > 0 ? params.kids.toString() : undefined,
      kids_ages: params.kidsAges.length > 0 ? params.kidsAges : undefined,
      hotel_ids: [parsedHotelId],
      page_number: 1,
      page_limit: 20,
      sort_by: 'relevance',
    };

    // Validate all required fields
    const requiredFields = ['from_city', 'from_country', 'to_country', 'start_date', 'nights', 'adults', 'search_type'];
    const isValid = requiredFields.every(field => searchParams[field]);
    
    return isValid ? searchParams : null;
  }, [params, hotelId, apiHotelData, sourceParams]);

  const handleSearch = useCallback(async () => {
    const searchParams = buildSearchParams();

    if (!searchParams) {
      return;
    }

    try {
      setIsSearching(true);
      const response = await startSearch(searchParams);

      if (response?.request_id && onSearchComplete) {
        onSearchComplete(response.request_id);
      }
    } catch (error) {
      console.error('[HotelSearchSection] Error starting search:', error);
    } finally {
      setIsSearching(false);
    }
  }, [buildSearchParams, onSearchComplete]);

  // ==========================================================================
  // Render
  // ==========================================================================

  const calendarRangeEnd = params.returnDate;

  const defaultDate = params.departureDate || new Date().toISOString().split('T')[0];

  return (
    <div className="content">
      <div className={styles.hotelSearchSection}>
        <div className={styles.searchForm}>
          <div className={styles.searchFields}>
            <div className={styles.searchGroup}>
              <SelectDate
                handleChange={handleDateFieldChange}
                value={defaultDate}
                endValue={calendarRangeEnd}
                className={styles.radioFrom}
              />
              <Nights
                handleChange={handleNightsChange}
                name="nights"
                value={params.nights.toString()}
              />
              <People
                handleChange={handleTouristsChange}
                value={{
                  adults: params.adults.toString(),
                  kids: params.kids.toString(),
                  kids_ages: params.kidsAges,
                }}
                className={styles.whereFrom}
              />
            </div>
          </div>
          <Button
            br={16}
            icon="search"
            title="Найти"
            onClick={handleSearch}
            disabled={isSearching}
          />
        </div>
      </div>
    </div>
  );
};

export default HotelSearchSection;
