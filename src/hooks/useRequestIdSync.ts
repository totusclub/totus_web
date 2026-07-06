import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { useRouter } from 'next/router';
import { useSelector } from 'react-redux';
import { RootState } from '@/store';

/**
 * Keeps `request_id` aligned with the URL (back/forward) while allowing a brief
 * local override until `router.replace` finishes after a new hotel search.
 */
export const useRequestIdSync = (): {
  requestId: string | null | undefined;
  localRequestId: string | null;
  setLocalRequestId: (id: string) => void;
} => {
  const router = useRouter();
  const { requestId: storeRequestId } = useSelector((state: RootState) => state.search);

  const rawRequestId = router.query.request_id;
  const existingRequestId = Array.isArray(rawRequestId) ? rawRequestId[0] : rawRequestId;
  const initialRequestId = storeRequestId || null;
  const [localRequestId, setLocalRequestIdState] = useState<string | null>(null);
  const pendingRequestIdRef = useRef<string | null>(null);

  const rawHotelId = router.query.hotel_id;
  const hotelIdInUrl = Array.isArray(rawHotelId) ? rawHotelId[0] : rawHotelId;
  const hotelOnlyDeepLink = Boolean(hotelIdInUrl) && !existingRequestId;

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

    if (pendingRequestIdRef.current) {
      if (pendingRequestIdRef.current === existingRequestId) {
        pendingRequestIdRef.current = null;
      }
      setLocalRequestIdState(existingRequestId);
      return;
    }

    setLocalRequestIdState(existingRequestId);
  }, [router.isReady, existingRequestId]);

  const requestId = useMemo(() => {
    if (pendingRequestIdRef.current) {
      return pendingRequestIdRef.current;
    }
    if (existingRequestId) return existingRequestId;
    if (localRequestId) return localRequestId;
    if (hotelOnlyDeepLink) return undefined;
    return initialRequestId ?? undefined;
  }, [existingRequestId, localRequestId, hotelOnlyDeepLink, initialRequestId]);

  return {
    requestId,
    localRequestId,
    setLocalRequestId,
  };
};

