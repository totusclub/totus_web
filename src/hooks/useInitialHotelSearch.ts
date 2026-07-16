import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/router';
import {
    buildHotelSearchQueryUpdate,
    createHotelSearchRequest,
    isHotelScopedRequestId,
} from '@/utils/hotelSearchRefresh';

export type InitialHotelSearchState = {
    searching: boolean;
    settled: boolean;
};

/**
 * Runs hotel-scoped startSearch when needed:
 * - no request_id (deep link / favorites / search list without id)
 * - URL has a listing request_id that is not hotel-scoped (partial rooms)
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
  const upgradeAttemptedRef = useRef<string | null>(null);

  useEffect(() => {
    if (!isReady || !hotelId) return;

    const hasHotelScopedId =
      Boolean(requestId) && isHotelScopedRequestId(hotelId, requestId);

    // Already have a hotel-scoped search — use it.
    if (hasHotelScopedId) {
      setSettled(true);
      return;
    }

    // Listing request_id in URL: upgrade once to a hotel-scoped search.
    const listingRequestId = requestId ? String(requestId) : null;
    const upgradeKey = listingRequestId
      ? `${hotelId}:${listingRequestId}`
      : `${hotelId}:new`;

    if (upgradeAttemptedRef.current === upgradeKey) {
      setSettled(true);
      return;
    }

    let isMounted = true;

    const runInitialSearch = async () => {
      upgradeAttemptedRef.current = upgradeKey;
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
