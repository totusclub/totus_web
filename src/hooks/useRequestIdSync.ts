import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/router';
import { useSelector } from 'react-redux';
import { RootState } from '@/store';

/**
 * Hook to manage request_id from multiple sources:
 * 1. Local state (updated when new search is triggered)
 * 2. URL query (when coming from hotels list)
 * 3. Redux store (fallback)
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
  const [localRequestId, setLocalRequestId] = useState<string | null>(null);

  const rawHotelId = router.query.hotel_id;
  const hotelIdInUrl = Array.isArray(rawHotelId) ? rawHotelId[0] : rawHotelId;
  const hotelOnlyDeepLink = Boolean(hotelIdInUrl) && !existingRequestId;

  // Sync localRequestId from URL when coming from hotel list
  useEffect(() => {
    if (router.isReady && existingRequestId && !localRequestId) {
      setLocalRequestId(existingRequestId);
    }
  }, [router.isReady, existingRequestId, localRequestId]);

  // Sync localRequestId from Redux when it changes externally (but only if no URL request_id).
  // Skip when URL is a deep hotel link (hotel_id without request_id): a new search will run;
  // a stale Redux request_id would load wrong rooms for this hotel.
  useEffect(() => {
    if (!router.isReady) return;
    if (hotelOnlyDeepLink && initialRequestId) {
      return;
    }
    if (initialRequestId && initialRequestId !== localRequestId && !localRequestId && !existingRequestId) {
      setLocalRequestId(initialRequestId);
    }
  }, [router.isReady, hotelOnlyDeepLink, initialRequestId, localRequestId, existingRequestId]);

  // Prefer URL/local. On deep hotel links (hotel_id, no request_id), ignore Redux — wrong search for this hotel.
  const requestId = useMemo(() => {
    if (localRequestId) return localRequestId;
    if (existingRequestId) return existingRequestId;
    if (hotelOnlyDeepLink) return undefined;
    return initialRequestId ?? undefined;
  }, [localRequestId, existingRequestId, hotelOnlyDeepLink, initialRequestId]);

  return {
    requestId,
    localRequestId,
    setLocalRequestId,
  };
};

