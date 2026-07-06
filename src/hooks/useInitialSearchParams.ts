import { useMemo } from 'react';
import { useRouter } from 'next/router';
import { parseSearchParamsFromQuery, ParsedSearchParams, HOTEL_DETAILS_DEFAULT_FLEX_DATES } from '@/utils/hotelDetailsUtils';

/**
 * Hook to parse initial search parameters from URL query
 */
export const useInitialSearchParams = (): ParsedSearchParams | null => {
  const router = useRouter();

  return useMemo(() => {
    if (!router.isReady) return null;
    return parseSearchParamsFromQuery(router.query, {
      defaultFlexDates: HOTEL_DETAILS_DEFAULT_FLEX_DATES,
    });
  }, [router.isReady, router.query]);
};

