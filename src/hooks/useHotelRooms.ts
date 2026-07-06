import { useState, useEffect, useRef } from 'react';
import { getHotelRooms, checkSearchStatus } from '@/api/levelTravelApi';
import type { HotelRoomFilters } from '@/utils/roomFilters';
import { cloneRoomFilters } from '@/utils/roomFilters';
import { isStaleSearchRequestError } from '@/utils/hotelSearchRefresh';
import { shouldStopSearchPolling } from '@/utils/searchStatus';
import { stopActiveSearchPoll } from '@/store/slices/searchSlice';

interface UseHotelRoomsResult {
  rooms: any[];
  roomFilters: HotelRoomFilters | null;
  loading: boolean;
}

interface UseHotelRoomsOptions {
  onRequestIdStale?: (failedRequestId: string) => void;
}

const MAX_POLLS = 10;
const POLL_DELAY = 2500;
const STATUS_FAIL_POLLS_BEFORE_STALE = 3;

/**
 * Fetch hotel rooms for a hotel-details search.
 * If the request_id is expired or APIs fail, calls onRequestIdStale so the page can start a new search.
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
  const staleNotifiedRef = useRef(false);

  useEffect(() => {
    onRequestIdStaleRef.current = options?.onRequestIdStale;
  }, [options?.onRequestIdStale]);

  useEffect(() => {
    setRooms([]);
    setRoomFilters(null);
    staleNotifiedRef.current = false;

    if (!isReady || !requestId || !hotelId) {
      setLoading(false);
      return;
    }

    stopActiveSearchPoll();
    setLoading(true);

    let isMounted = true;
    let pollTimeout: ReturnType<typeof setTimeout> | null = null;
    let pollStopped = false;
    let searchCompleted = false;
    let pollCount = 0;

    const clearPollTimeout = () => {
      if (pollTimeout) {
        clearTimeout(pollTimeout);
        pollTimeout = null;
      }
    };

    const finishLoading = () => {
      if (isMounted) {
        setLoading(false);
      }
    };

    const fetchRooms = async (): Promise<{ gotRooms: boolean; requestFailed: boolean }> => {
      try {
        const allRooms = await getHotelRooms({
          request_id: requestId,
          hotel_id: hotelId,
        });

        const result = allRooms?.result || [];

        if (!isMounted) {
          return { gotRooms: result.length > 0, requestFailed: false };
        }

        setRooms(result);
        setRoomFilters(cloneRoomFilters(allRooms?.filters ?? null));

        if (result.length > 0) {
          setLoading(false);
        }

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

    const completeSearchAndFetchRooms = async () => {
      searchCompleted = true;
      pollStopped = true;
      clearPollTimeout();
      await fetchRooms();
      finishLoading();
    };

    const tryCompleteFromStatus = async (): Promise<boolean> => {
      const searchStatus = await checkSearchStatus(requestId);
      if (!searchStatus) return false;
      if (!shouldStopSearchPolling(searchStatus.status, searchStatus.completeness)) {
        return false;
      }
      if (!isMounted) return true;
      await completeSearchAndFetchRooms();
      return true;
    };

    const notifyStaleRequestId = async () => {
      if (!isMounted || staleNotifiedRef.current || searchCompleted) return;
      if (await tryCompleteFromStatus()) return;

      staleNotifiedRef.current = true;
      pollStopped = true;
      clearPollTimeout();
      finishLoading();
      onRequestIdStaleRef.current?.(requestId);
    };

    const scheduleNextPoll = () => {
      if (searchCompleted || pollStopped) return;
      clearPollTimeout();
      pollTimeout = setTimeout(() => {
        if (isMounted && !pollStopped && !searchCompleted) {
          void pollForSearchCompletion();
        }
      }, POLL_DELAY);
    };

    const pollForSearchCompletion = async () => {
      if (!isMounted || pollStopped || searchCompleted) return;

      pollCount += 1;

      if (pollCount > MAX_POLLS) {
        if (await tryCompleteFromStatus()) return;

        pollStopped = true;
        clearPollTimeout();
        await fetchRooms();
        finishLoading();
        return;
      }

      const searchStatus = await checkSearchStatus(requestId);

      if (!searchStatus) {
        if (pollCount >= STATUS_FAIL_POLLS_BEFORE_STALE) {
          if (await tryCompleteFromStatus()) return;

          const { gotRooms, requestFailed } = await fetchRooms();
          if (requestFailed || !gotRooms) {
            await notifyStaleRequestId();
          } else {
            finishLoading();
          }
          return;
        }

        scheduleNextPoll();
        return;
      }

      if (shouldStopSearchPolling(searchStatus.status, searchStatus.completeness)) {
        if (!isMounted) return;
        await completeSearchAndFetchRooms();
        return;
      }

      scheduleNextPoll();
    };

    const loadRooms = async () => {
      if (await tryCompleteFromStatus()) return;

      const { gotRooms, requestFailed } = await fetchRooms();

      if (!isMounted || pollStopped) return;

      if (requestFailed) {
        if (await tryCompleteFromStatus()) return;
        await notifyStaleRequestId();
        return;
      }

      if (gotRooms) {
        finishLoading();
        return;
      }

      void pollForSearchCompletion();
    };

    void loadRooms();

    return () => {
      isMounted = false;
      pollStopped = true;
      pollCount = 0;
      clearPollTimeout();
    };
  }, [isReady, requestId, hotelId, refreshKey]);

  return { rooms, roomFilters, loading };
};
