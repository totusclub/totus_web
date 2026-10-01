import { useState, useEffect, useRef } from 'react';
import { getHotelRooms, checkSearchStatus } from '@/api/levelTravelApi';
import type { HotelRoomFilters } from '@/utils/roomFilters';
import { cloneRoomFilters } from '@/utils/roomFilters';
import { isStaleSearchRequestError } from '@/utils/hotelSearchRefresh';
import {
  getReadySearchOperators,
  isSearchFullyComplete,
} from '@/utils/searchStatus';

interface UseHotelRoomsResult {
  rooms: any[];
  roomFilters: HotelRoomFilters | null;
  loading: boolean;
}

interface UseHotelRoomsOptions {
  onRequestIdStale?: (failedRequestId: string) => void;
}

/** Wait long enough for late operators (pending → completed). */
const MAX_POLLS = 30;
const POLL_DELAY_MS = 2000;

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Fetch hotel rooms for a hotel-details search.
 * Shows rooms as soon as any arrive, but keeps polling while operators are
 * still pending so later offers are not missed.
 */
export const useHotelRooms = (
  requestId: string | null | undefined,
  hotelId: string | undefined,
  isReady: boolean,
  refreshKey = 0,
  options?: UseHotelRoomsOptions,
): UseHotelRoomsResult => {
  const [rooms, setRooms] = useState<any[]>([]);
  const [roomFilters, setRoomFilters] = useState<HotelRoomFilters | null>(null);
  const [loading, setLoading] = useState(false);
  const onRequestIdStaleRef = useRef(options?.onRequestIdStale);
  const lastFetchedRef = useRef<{
    requestId: string;
    hotelId: string;
    refreshKey: number;
  } | null>(null);
  const prevFetchKeyRef = useRef<string | null>(null);

  useEffect(() => {
    onRequestIdStaleRef.current = options?.onRequestIdStale;
  }, [options?.onRequestIdStale]);

  useEffect(() => {
    if (!isReady || !hotelId) {
      setLoading(false);
      return;
    }

    if (!requestId) {
      setLoading(true);
      return;
    }

    const requestIdStr = String(requestId);
    const hotelIdStr = String(hotelId);
    const currentFetchKey = `${requestIdStr}:${hotelIdStr}:${refreshKey}`;

    if (prevFetchKeyRef.current === currentFetchKey) {
      setLoading(false);
      return;
    }

    const isSubsequentSearch = prevFetchKeyRef.current !== null;
    prevFetchKeyRef.current = currentFetchKey;
    lastFetchedRef.current = null;

    if (isSubsequentSearch) {
      setRooms([]);
      setRoomFilters(null);
    }
    setLoading(true);

    let isMounted = true;
    let staleNotified = false;

    const finishLoading = () => {
      if (isMounted) {
        setLoading(false);
      }
    };

    const markFetched = () => {
      lastFetchedRef.current = {
        requestId: requestIdStr,
        hotelId: hotelIdStr,
        refreshKey,
      };
    };

    const fetchRooms = async (): Promise<{
      gotRooms: boolean;
      roomCount: number;
      requestFailed: boolean;
    }> => {
      try {
        const allRooms = await getHotelRooms({
          request_id: requestIdStr,
          hotel_id: hotelIdStr,
        });

        const result = allRooms?.result || [];

        if (!isMounted) {
          return {
            gotRooms: result.length > 0,
            roomCount: result.length,
            requestFailed: false,
          };
        }

        setRooms(result);
        setRoomFilters(cloneRoomFilters(allRooms?.filters ?? null));

        return {
          gotRooms: result.length > 0,
          roomCount: result.length,
          requestFailed: false,
        };
      } catch (err) {
        console.error('[useHotelRooms] Failed to fetch hotel rooms:', err);
        if (isMounted) {
          setRooms([]);
          setRoomFilters(null);
        }
        return {
          gotRooms: false,
          roomCount: 0,
          requestFailed: isStaleSearchRequestError(err),
        };
      }
    };

    const notifyStaleRequestId = () => {
      if (!isMounted || staleNotified) return;
      staleNotified = true;
      finishLoading();
      onRequestIdStaleRef.current?.(requestIdStr);
    };

    const loadRooms = async () => {
      let lastReadyCount = 0;
      let sawAnyRooms = false;
      let statusFailStreak = 0;

      for (let poll = 0; poll < MAX_POLLS; poll += 1) {
        if (!isMounted) return;

        const searchStatus = await checkSearchStatus(requestIdStr);
        const statusMap = searchStatus?.status;
        const completeness = searchStatus?.completeness;
        const readyCount = statusMap
          ? getReadySearchOperators(statusMap).length
          : 0;
        const searchDone = statusMap
          ? isSearchFullyComplete(statusMap, completeness)
          : false;

        if (!searchStatus) {
          statusFailStreak += 1;
        } else {
          statusFailStreak = 0;
        }

        const shouldFetchRooms =
          poll === 0 ||
          searchDone ||
          readyCount > lastReadyCount ||
          (!sawAnyRooms && readyCount > 0);

        // Result of a fetch made on this poll after the search was already complete.
        let fetchedAfterDone: Awaited<ReturnType<typeof fetchRooms>> | null = null;

        if (shouldFetchRooms) {
          const fetched = await fetchRooms();
          // Reuse only a successful response with rooms; on an empty/failed response
          // the final refresh below still runs (it doubles as an immediate retry).
          if (searchDone && fetched.gotRooms) fetchedAfterDone = fetched;
          if (!isMounted) return;

          if (fetched.requestFailed) {
            notifyStaleRequestId();
            return;
          }

          if (fetched.gotRooms) {
            sawAnyRooms = true;
            // Show first rooms while remaining operators are still pending.
            finishLoading();
          }

          lastReadyCount = Math.max(lastReadyCount, readyCount);
        }

        if (searchDone) {
          // Final refresh after all operators finished. The fetch above already ran
          // with searchDone=true (same request_id, same data) — reuse it instead of
          // sending an identical /hotels-rooms request.
          const finalFetch = fetchedAfterDone ?? (await fetchRooms());
          if (!isMounted) return;

          if (finalFetch.requestFailed && !sawAnyRooms) {
            notifyStaleRequestId();
            return;
          }

          markFetched();
          finishLoading();
          return;
        }

        // Status API unavailable for several polls and still no rooms → stale.
        if (!sawAnyRooms && statusFailStreak >= 3) {
          const retry = await fetchRooms();
          if (!isMounted) return;
          if (retry.requestFailed || !retry.gotRooms) {
            notifyStaleRequestId();
            return;
          }
          sawAnyRooms = true;
          finishLoading();
        }

        if (poll < MAX_POLLS - 1) {
          await sleep(POLL_DELAY_MS);
        }
      }

      const finalTry = await fetchRooms();
      if (!isMounted) return;

      markFetched();
      finishLoading();

      if (!finalTry.gotRooms && (finalTry.requestFailed || !sawAnyRooms)) {
        notifyStaleRequestId();
      }
    };

    void loadRooms();

    return () => {
      isMounted = false;
    };
  }, [isReady, requestId, hotelId, refreshKey]);

  return { rooms, roomFilters, loading };
};
