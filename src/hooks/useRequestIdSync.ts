import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { useRouter } from 'next/router';

/**
 * Keeps `request_id` aligned with the URL (back/forward) while allowing a brief
 * local override until `router.replace` finishes after a new hotel search.
 *
 * - Always trust `request_id` in the URL (shared links / refresh).
 * - Never fall back to Redux listing `request_id` (wrong inventory on first open).
 * - Stale URL ids are refreshed by useHotelRooms + useStaleHotelSearchRefresh.
 */
export const useRequestIdSync = (): {
  requestId: string | null | undefined;
  localRequestId: string | null;
  setLocalRequestId: (id: string) => void;
} => {
  const router = useRouter();

  const rawRequestId = router.query.request_id;
  const existingRequestId = Array.isArray(rawRequestId) ? rawRequestId[0] : rawRequestId;
  const [localRequestId, setLocalRequestIdState] = useState<string | null>(null);
  const pendingRequestIdRef = useRef<string | null>(null);

  const rawHotelId = router.query.hotel_id;
  const hotelIdInUrl = Array.isArray(rawHotelId) ? rawHotelId[0] : rawHotelId;

  const setLocalRequestId = useCallback((id: string) => {
    pendingRequestIdRef.current = id;
    setLocalRequestIdState(id);
  }, []);

  // Follow URL on back/forward and after shallow replace completes.
  useEffect(() => {
    if (!router.isReady) return;

    if (!existingRequestId) {
      if (!pendingRequestIdRef.current) {
        setLocalRequestIdState(null);
      }
      return;
    }

    // Remember only hotel-scoped ids we just created — never mark a listing
    // request_id as hotel-scoped (that blocked a fresh hotel search).
    if (
      hotelIdInUrl &&
      typeof window !== 'undefined' &&
      pendingRequestIdRef.current &&
      pendingRequestIdRef.current === existingRequestId
    ) {
      sessionStorage.setItem(`hotel_scoped_rid_${hotelIdInUrl}`, String(existingRequestId));
    }

    if (pendingRequestIdRef.current) {
      if (pendingRequestIdRef.current === existingRequestId) {
        pendingRequestIdRef.current = null;
      }
      setLocalRequestIdState(existingRequestId);
      return;
    }

    setLocalRequestIdState(existingRequestId);
  }, [router.isReady, existingRequestId, hotelIdInUrl]);

  const requestId = useMemo(() => {
    if (pendingRequestIdRef.current) {
      return pendingRequestIdRef.current;
    }
    // Shared links and refresh: always use request_id from the URL.
    if (existingRequestId) {
      return existingRequestId;
    }
    if (localRequestId) return localRequestId;
    return undefined;
  }, [existingRequestId, localRequestId]);

  return {
    requestId,
    localRequestId,
    setLocalRequestId,
  };
};
