import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { startSearch } from '@/api/levelTravelApi';
import SelectDate from '@/components/search/date';
import Nights from '@/components/search/nights';
import People from '@/components/search/people';
import Button from '@/components/UI/button';
import { parseNightsValue, buildHotelSearchParamsFromForm, normalizeQueryDate, getDefaultStartDate, parseFlexDatesValue, HOTEL_DETAILS_DEFAULT_FLEX_DATES } from '@/utils/hotelDetailsUtils';
import { endYmdAfterNights } from '@/utils/calendarDateRange';
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
  flexDates: number;
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
  end_date_till?: string;
  nights?: string;
  search_type?: string;
  flex_dates?: string | number;
}

interface HotelSearchSectionProps {
  hotelId: string | null;
  apiHotelData?: ApiHotelData | null;
  onSearchComplete?: (requestId: string, snapshot: SearchParamsSnapshot) => void;
  initialSearchParams?: InitialSearchParams | null;
  /** Current search session — resets the form when URL request_id changes (e.g. browser back). */
  searchSessionKey?: string | null;
  runStart?: boolean;
}

interface SearchParamsState {
  departureDate: string;
  /** Checkout / return date from calendar; nights slider does not overwrite until changed */
  returnDate: string;
  nights: number;
  flexDates: number;
  adults: number;
  kids: number;
  kidsAges: number[];
}

// ============================================================================
// Constants & Helpers
// ============================================================================

const DEFAULT_ADULTS = 2;
const DEFAULT_KIDS = 0;

function buildParamsFromSource(source: InitialSearchParams | null): SearchParamsState {
  const initNights = parseNightsValue(String(source?.nights ?? ''));
  const initDep =
    normalizeQueryDate(source?.start_date) || getDefaultStartDate();
  return {
    departureDate: initDep,
    returnDate:
      normalizeQueryDate(source?.end_date_till) ||
      endYmdAfterNights(initDep, initNights),
    nights: initNights,
    flexDates: parseFlexDatesValue(
      source?.flex_dates,
      HOTEL_DETAILS_DEFAULT_FLEX_DATES,
    ),
    adults: parseInt(source?.adults || String(DEFAULT_ADULTS), 10) || DEFAULT_ADULTS,
    kids: parseInt(source?.kids || String(DEFAULT_KIDS), 10) || DEFAULT_KIDS,
    kidsAges: source?.kids_ages || [],
  };
}

// ============================================================================
// Component
// ============================================================================

export type { SearchParamsSnapshot };

const HotelSearchSection: React.FC<HotelSearchSectionProps> = ({
  hotelId,
  apiHotelData,
  onSearchComplete,
  initialSearchParams,
  searchSessionKey,
  runStart = false,
}) => {
  // ==========================================================================
  // State
  // ==========================================================================
  
  const [isSearching, setIsSearching] = useState(false);
  const [hasUserChangedParams, setHasUserChangedParams] = useState(false);
  const paramsRef = useRef<SearchParamsState | null>(null);
  const prevHotelIdRef = useRef<string | null>(null);
  const prevSearchSessionRef = useRef<string | null>(null);
  const searchInFlightRef = useRef(false);
  
  const sourceParams = useMemo(
    () => initialSearchParams || null,
    [initialSearchParams]
  );

  // Initialize form state from sourceParams or defaults
  const [params, setParams] = useState<SearchParamsState>(() =>
    buildParamsFromSource(sourceParams),
  );

  paramsRef.current = params;

  // ==========================================================================
  // Effects
  // ==========================================================================

  // Reset form when hotel or search session (request_id) changes — e.g. browser back.
  useEffect(() => {
    if (!hotelId || !sourceParams?.start_date) return;

    const isNewHotel = prevHotelIdRef.current !== hotelId;
    const isNewSession =
      searchSessionKey != null && prevSearchSessionRef.current !== searchSessionKey;

    if (isNewHotel) {
      prevHotelIdRef.current = hotelId;
    }
    if (isNewSession) {
      prevSearchSessionRef.current = searchSessionKey ?? null;
    }

    if (isNewHotel || isNewSession) {
      setParams(buildParamsFromSource(sourceParams));
      setHasUserChangedParams(false);
      return;
    }

    if (!hasUserChangedParams) {
      const next = buildParamsFromSource(sourceParams);
      setParams((prev) => {
        const changed =
          prev.departureDate !== next.departureDate ||
          prev.returnDate !== next.returnDate ||
          prev.nights !== next.nights ||
          prev.flexDates !== next.flexDates ||
          prev.adults !== next.adults ||
          prev.kids !== next.kids ||
          JSON.stringify(prev.kidsAges) !== JSON.stringify(next.kidsAges);
        return changed ? next : prev;
      });
    }
  }, [hotelId, searchSessionKey, sourceParams, hasUserChangedParams]);

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
    const normalized = normalizeQueryDate(date);
    if (!normalized) return;
    setHasUserChangedParams(true);
    setParams((prev) => ({
      ...prev,
      departureDate: normalized,
      returnDate: endYmdAfterNights(normalized, prev.nights),
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
      nightsValue = cleaned ? parseInt(cleaned, 10) : parseNightsValue('');
    } else {
      return;
    }
    
    setHasUserChangedParams(true);
    setParams((prev) => ({
      ...prev,
      nights: nightsValue,
      returnDate: endYmdAfterNights(prev.departureDate, nightsValue),
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
      return;
    }
    if (key === 'flex_dates') {
      const flexDates = parseFlexDatesValue(value, 0);
      updateParams({ flexDates });
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

  const buildSearchParams = useCallback((
    current: SearchParamsState,
  ): Record<string, unknown> | null => {
    if (!hotelId) return null;

    return buildHotelSearchParamsFromForm(hotelId, {
      query: sourceParams,
      apiHotelData,
      departureDate: current.departureDate,
      returnDate: current.returnDate,
      nights: current.nights,
      flexDates: current.flexDates,
      adults: current.adults,
      kids: current.kids,
      kidsAges: current.kidsAges,
    });
  }, [hotelId, apiHotelData, sourceParams]);

  const handleSearch = useCallback(async () => {
    if (searchInFlightRef.current) return;

    const current = paramsRef.current ?? params;
    const searchParams = buildSearchParams(current);

    if (!searchParams) {
      return;
    }

    const snapshot: SearchParamsSnapshot = {
      startDateISO: current.departureDate,
      nights: current.nights,
      flexDates: current.flexDates,
      adults: current.adults,
      kids: current.kids,
      kidsAges: current.kidsAges,
    };

    try {
      searchInFlightRef.current = true;
      setIsSearching(true);
      const response = await startSearch(searchParams);

      if (response?.request_id && onSearchComplete) {
        onSearchComplete(response.request_id, snapshot);
      }
    } catch (error) {
      console.error('[HotelSearchSection] Error starting search:', error);
    } finally {
      searchInFlightRef.current = false;
      setIsSearching(false);
    }
  }, [params, buildSearchParams, onSearchComplete]);

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
                flexDates={params.flexDates}
                departureOnlyLabel
                className={styles.radioFrom}
              />
              <Nights
                handleChange={handleDateFieldChange}
                name="nights"
                value={params.nights.toString()}
                flexDates={String(params.flexDates)}
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
            onClick={() => handleSearch()}
            disabled={isSearching}
          />
        </div>
      </div>
    </div>
  );
};

export default HotelSearchSection;
