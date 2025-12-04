import { useState, useEffect } from 'react';
import { getHotelRooms, checkSearchStatus } from '@/api/levelTravelApi';

interface UseHotelRoomsResult {
  rooms: any[];
  loading: boolean;
}

const MAX_POLLS = 10; // Max 10 polls (30 seconds)
const POLL_DELAY = 3000; // 3 seconds between polls
const MIN_POLLS_BEFORE_FALLBACK = 3; // Try fetching after 3 failed status checks

/**
 * Hook to fetch hotel rooms with search status polling
 * Waits for search to complete before fetching rooms
 */
export const useHotelRooms = (
  requestId: string | null | undefined,
  hotelId: string | undefined,
  isReady: boolean
): UseHotelRoomsResult => {
  const [rooms, setRooms] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Clear rooms when requestId changes (new search started)
    setRooms([]);
    
    if (!isReady || !requestId || !hotelId) {
      setLoading(false);
      return;
    }

    // Start loading immediately when we have a requestId
    setLoading(true);

    let isMounted = true;
    let pollTimeout: NodeJS.Timeout | null = null;
    let hasFetched = false;
    let pollCount = 0;

    const fetchRooms = async (): Promise<void> => {
      if (hasFetched || !isMounted) return;
      hasFetched = true;

      if (pollTimeout) {
        clearTimeout(pollTimeout);
        pollTimeout = null;
      }
      try {
        const roomParams = {
          request_id: requestId,
          hotel_id: hotelId,
        };

        const allRooms = await getHotelRooms(roomParams);
        
        if (isMounted) {
          setRooms(allRooms?.result || []);
          setLoading(false);
        }
      } catch (err) {
        console.error('[useHotelRooms] Failed to fetch hotel rooms:', err);
        if (isMounted) {
          setRooms([]);
          setLoading(false);
        }
      }
    };

    const pollForSearchCompletion = async () => {
      if (hasFetched || !isMounted) return;

      pollCount++;

      // Max polls reached, try fetching anyway
      if (pollCount > MAX_POLLS) {
        console.warn('[useHotelRooms] Max polls reached, attempting to fetch rooms anyway');
        await fetchRooms();
        return;
      }

      try {
        const statusMap = await checkSearchStatus(requestId);
        const readyOperators = Object.entries(statusMap)
          .filter(([_, status]) => status === 'completed' || status === 'cached')
          .map(([id]) => id);

        if (readyOperators.length > 0) {
          // Search is complete, fetch rooms
          await fetchRooms();
        } else {
          // Search not ready yet, poll again
          pollTimeout = setTimeout(() => {
            if (isMounted && !hasFetched) {
              pollForSearchCompletion();
            }
          }, POLL_DELAY);
        }
      } catch (err) {
        console.error('[useHotelRooms] Error checking search status:', err);
        // After a few failed attempts, try to fetch rooms anyway (might be cached)
        if (pollCount >= MIN_POLLS_BEFORE_FALLBACK) {
          await fetchRooms();
        } else {
          pollTimeout = setTimeout(() => {
            if (isMounted && !hasFetched) {
              pollForSearchCompletion();
            }
          }, POLL_DELAY);
        }
      }
    };

    // Start polling immediately
    pollForSearchCompletion();

    return () => {
      isMounted = false;
      hasFetched = false;
      pollCount = 0;
      if (pollTimeout) {
        clearTimeout(pollTimeout);
      }
    };
  }, [isReady, requestId, hotelId]);

  return { rooms, loading };
};

