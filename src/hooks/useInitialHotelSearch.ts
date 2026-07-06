import { useEffect } from 'react';
import { useRouter } from 'next/router';
import {
    buildHotelSearchQueryUpdate,
    createHotelSearchRequest,
} from '@/utils/hotelSearchRefresh';

/**
 * Runs startSearch when there is a hotel_id but no request_id yet.
 * `buildInitialSearchParams` fills defaults (dates, Moscow, adults, …) so deep links work:
 * favorites, share, refresh on `/hotel-details?hotel_id=…` only.
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

    const query = router.query;

    // Keep the list search request_id when navigating from search results.
    if (requestId || localRequestId) {
      return;
    }

    let isMounted = true;

    const runInitialSearch = async () => {
      try {
        const newRequestId = await createHotelSearchRequest(query, hotelId);

        if (isMounted && newRequestId) {
          setLocalRequestId(newRequestId);

          const newQuery = buildHotelSearchQueryUpdate(query, hotelId, newRequestId);

          router.replace({ pathname: router.pathname, query: newQuery }, undefined, { shallow: true });
        }
      } catch (error) {
        console.error("[useInitialHotelSearch] Failed to start hotel search", error);
      }
    };

    runInitialSearch();

    return () => {
      isMounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isReady, hotelId, requestId, localRequestId, setLocalRequestId]);
};

