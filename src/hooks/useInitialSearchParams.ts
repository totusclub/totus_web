import { useMemo } from 'react';
import { useRouter } from 'next/router';
import { parseSearchParamsFromQuery, ParsedSearchParams } from '@/utils/hotelDetailsUtils';

/**
 * Hook to parse initial search parameters from URL query
 */
export const useInitialSearchParams = (): ParsedSearchParams | null => {
  const router = useRouter();

  return useMemo(() => {
    if (!router.isReady) return null;
    return parseSearchParamsFromQuery(router.query);
  }, [router.isReady, router.query]);
};

