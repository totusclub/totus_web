import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { startSearch } from '@/api/levelTravelApi';
import SelectDate from '@/components/search/date';
import Nights from '@/components/search/nights';
import People from '@/components/search/people';
import Button from '@/components/UI/button';
import { parseNightsValue } from '@/utils/hotelDetailsUtils';
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

/**
 * Parses flex_dates value (can be string or number).
 */
const parseFlexDates = (flexDates?: string | number): number => {
  if (!flexDates) return DEFAULT_FLEX_DATES;
  return typeof flexDates === 'string' ? parseInt(flexDates, 10) : flexDates;
};

/**
 * Formats nights as range when flex_dates is enabled.
 * Example: 7 with flex_dates=2 becomes "7..9"
 */
const formatNightsForAPI = (nights: number, flexDates: number): string => {
  return flexDates > 0 
    ? `${nights}..${nights + flexDates}`
    : nights.toString();
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
  const [params, setParams] = useState<SearchParamsState>(() => ({
    departureDate: sourceParams?.start_date || getDefaultStartDate(),
    nights: parseNightsValue(sourceParams?.nights),
    adults: parseInt(sourceParams?.adults || String(DEFAULT_ADULTS), 10),
    kids: parseInt(sourceParams?.kids || String(DEFAULT_KIDS), 10),
    kidsAges: sourceParams?.kids_ages || [],
  }));

  // ==========================================================================
  // Effects
  // ==========================================================================

  // Sync params with sourceParams when they change externally
  // Only syncs if user hasn't made manual changes
  useEffect(() => {
    if (!sourceParams?.start_date || hasUserChangedParams) return;

    const newParams = {
      departureDate: sourceParams.start_date,
      nights: parseNightsValue(sourceParams.nights),
      adults: parseInt(sourceParams.adults || String(DEFAULT_ADULTS), 10),
      kids: parseInt(sourceParams.kids || String(DEFAULT_KIDS), 10),
      kidsAges: sourceParams.kids_ages || [],
    };

    setParams(prev => {
      // Skip update if values haven't changed
      const hasChanged = 
        prev.departureDate !== newParams.departureDate ||
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
    if (normalized) {
      updateParams({ departureDate: normalized });
    }
  }, [updateParams]);

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
    
    updateParams({ nights: nightsValue });
  }, [updateParams]);

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
    if (!params.departureDate || params.nights <= 0 || params.adults < 1) {
      return null;
    }

    const parsedHotelId = hotelId ? parseInt(hotelId, 10) : null;
    if (!parsedHotelId || isNaN(parsedHotelId)) {
      return null;
    }

    // Calculate date range
    const startDateISO = params.departureDate;
    const startDate = new Date(startDateISO);
    const endDate = new Date(startDate);
    endDate.setDate(startDate.getDate() + params.nights);

    // Get hotel location data
    const hotelCountry = apiHotelData?.country;
    const hotelCity = apiHotelData?.city;

    // Parse flex_dates and format nights
    const flexDates = parseFlexDates(sourceParams?.flex_dates);
    const nightsFormatted = formatNightsForAPI(params.nights, flexDates);

    // Build search parameters
    const searchParams: Record<string, unknown> = {
      from_city: sourceParams?.from_city || DEFAULT_FROM_CITY,
      from_country: sourceParams?.from_country || DEFAULT_FROM_COUNTRY,
      to_country: sourceParams?.to_country || hotelCountry?.iso2 || '',
      to_city: sourceParams?.to_city || hotelCity?.name_en || hotelCity?.name_ru || undefined,
      search_type: sourceParams?.search_type || DEFAULT_SEARCH_TYPE,
      flex_dates: flexDates,
      start_date: startDateISO,
      start_date_from: startDateISO,
      end_date_till: formatDateToISO(endDate),
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

  const defaultDate = params.departureDate || new Date().toISOString().split('T')[0];

  return (
    <div className="content">
      <div className={styles.hotelSearchSection}>
        <div className={styles.searchForm}>
          <div className={styles.searchFields}>
            <div className={styles.searchGroup}>
              <SelectDate
                handleChange={handleDateChange}
                name="form_date"
                value={defaultDate}
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
