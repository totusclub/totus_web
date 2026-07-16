import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import {
    buildHotelSearchQueryUpdate,
    createHotelSearchRequest,
} from '@/utils/hotelSearchRefresh';

export type InitialHotelSearchState = {
    searching: boolean;
    settled: boolean;
};

/**
 * Runs hotel-scoped startSearch when there is a hotel_id but no request_id yet.
 * Deep links, favorites, and navigation from search results (without listing request_id).
 */
export const useInitialHotelSearch = (
  hotelId: string | undefined,
  requestId: string | null | undefined,
  localRequestId: string | null,
  isReady: boolean,
  setLocalRequestId: (id: string) => void,
): InitialHotelSearchState => {
  const router = useRouter();
  const [searching, setSearching] = useState(false);
  const [settled, setSettled] = useState(false);

  useEffect(() => {
    if (!isReady || !hotelId) return;

    // URL / pending hotel request_id already available — use it.
    // Do not treat a stale local-only id as settled when requestId is missing
    // (that caused infinite loading on shared links).
    if (requestId) {
      setSettled(true);
      return;
    }

    let isMounted = true;

    const runInitialSearch = async () => {
      setSearching(true);
      setSettled(false);
      try {
        const newRequestId = await createHotelSearchRequest(router.query, hotelId);

        if (isMounted && newRequestId) {
          setLocalRequestId(newRequestId);

          const newQuery = buildHotelSearchQueryUpdate(router.query, hotelId, newRequestId);

          await router.replace(
            { pathname: router.pathname, query: newQuery },
            undefined,
            { shallow: true },
          );
        }
      } catch (error) {
        console.error('[useInitialHotelSearch] Failed to start hotel search', error);
      } finally {
        if (isMounted) {
          setSearching(false);
          setSettled(true);
        }
      }
    };

    void runInitialSearch();

    return () => {
      isMounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isReady, hotelId, requestId, setLocalRequestId]);

  return { searching, settled };
};
