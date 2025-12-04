import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { startSearch } from '@/api/levelTravelApi';
import { buildInitialSearchParams, getDefaultStartDate } from '@/utils/hotelDetailsUtils';

/**
 * Hook to run initial search if we have search params but no request_id
 * This handles the case when coming from hot deals (no request_id in URL)
 */
export const useInitialHotelSearch = (
  hotelId: string | undefined,
  requestId: string | null | undefined,
  localRequestId: string | null,
  isReady: boolean,
  setLocalRequestId: (id: string) => void
): void => {
  const router = useRouter();

  useEffect(() => {
    if (!isReady || !hotelId) return;

    // If we already have request_id, don't start a new search
    if (requestId || localRequestId) {
      return;
    }

    // Check if we have search params in URL
    const query = router.query;
    const hasSearchParams = query.from_city || query.start_date || query.adults;

    if (!hasSearchParams) {
      return;
    }

    let isMounted = true;

    const runInitialSearch = async () => {
      try {
        const searchParams = buildInitialSearchParams(query, hotelId);
        const response = await startSearch(searchParams);

        if (isMounted && response?.request_id) {
          // Update local state first (this will trigger useHotelRooms)
          setLocalRequestId(response.request_id);
          
          // Update URL with request_id without reloading
          const newQuery = { ...query, request_id: response.request_id };
          router.replace(
            { pathname: router.pathname, query: newQuery },
            undefined,
            { shallow: true }
          );
        }
      } catch (error) {
        console.error('[useInitialHotelSearch] Failed to start hotel search from params', error);
      }
    };

    runInitialSearch();

    return () => {
      isMounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isReady, hotelId, requestId, localRequestId, setLocalRequestId]);
};

