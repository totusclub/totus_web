import { useState, useEffect, useRef } from 'react';
import { getHotelRooms, checkSearchStatus } from '@/api/levelTravelApi';
import type { HotelRoomFilters } from '@/utils/roomFilters';
import { cloneRoomFilters } from '@/utils/roomFilters';
import { isStaleSearchRequestError } from '@/utils/hotelSearchRefresh';
import { shouldStopSearchPolling } from '@/utils/searchStatus';

interface UseHotelRoomsResult {
  rooms: any[];
  roomFilters: HotelRoomFilters | null;
  loading: boolean;
}

interface UseHotelRoomsOptions {
  onRequestIdStale?: (failedRequestId: string) => void;
}

const MAX_POLLS = 12;
const POLL_DELAY_MS = 2000;

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Fetch hotel rooms for a hotel-details search.
 * Single fetch when possible; short status poll only when the first response is empty.
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

    const fetchRooms = async (): Promise<{ gotRooms: boolean; requestFailed: boolean }> => {
      try {
        const allRooms = await getHotelRooms({
          request_id: requestIdStr,
          hotel_id: hotelIdStr,
        });

        const result = allRooms?.result || [];

        if (!isMounted) {
          return { gotRooms: result.length > 0, requestFailed: false };
        }

        setRooms(result);
        setRoomFilters(cloneRoomFilters(allRooms?.filters ?? null));

        return { gotRooms: result.length > 0, requestFailed: false };
      } catch (err) {
        console.error('[useHotelRooms] Failed to fetch hotel rooms:', err);
        if (isMounted) {
          setRooms([]);
          setRoomFilters(null);
        }
        return { gotRooms: false, requestFailed: isStaleSearchRequestError(err) };
      }
    };

    const notifyStaleRequestId = () => {
      if (!isMounted || staleNotified) return;
      staleNotified = true;
      finishLoading();
      onRequestIdStaleRef.current?.(requestIdStr);
    };

    const loadRooms = async () => {
      const first = await fetchRooms();
      if (!isMounted) return;

      if (first.gotRooms) {
        markFetched();
        finishLoading();
        return;
      }

      if (first.requestFailed) {
        notifyStaleRequestId();
        return;
      }

      for (let poll = 0; poll < MAX_POLLS; poll += 1) {
        const searchStatus = await checkSearchStatus(requestIdStr);

        if (searchStatus && shouldStopSearchPolling(searchStatus.status, searchStatus.completeness)) {
          const retry = await fetchRooms();
          if (!isMounted) return;

          markFetched();
          finishLoading();

          if (!retry.gotRooms && retry.requestFailed) {
            notifyStaleRequestId();
          }
          return;
        }

        if (poll < MAX_POLLS - 1) {
          await sleep(POLL_DELAY_MS);
          if (!isMounted) return;
        }
      }

      const finalTry = await fetchRooms();
      if (!isMounted) return;

      markFetched();
      finishLoading();

      if (!finalTry.gotRooms && (finalTry.requestFailed || !staleNotified)) {
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
