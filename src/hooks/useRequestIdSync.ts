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

  const existingRequestId = router.query.request_id as string;
  const initialRequestId = storeRequestId || null;
  const [localRequestId, setLocalRequestId] = useState<string | null>(null);

  // Sync localRequestId from URL when coming from hotel list
  useEffect(() => {
    if (router.isReady && existingRequestId && !localRequestId) {
      setLocalRequestId(existingRequestId);
    }
  }, [router.isReady, existingRequestId, localRequestId]);

  // Sync localRequestId from Redux when it changes externally (but only if no URL request_id)
  useEffect(() => {
    if (initialRequestId && initialRequestId !== localRequestId && !localRequestId && !existingRequestId) {
      setLocalRequestId(initialRequestId);
    }
  }, [initialRequestId, localRequestId, existingRequestId]);

  // Use local request_id if available, otherwise fall back to URL or Redux store
  const requestId = useMemo(() => {
    return localRequestId || existingRequestId || initialRequestId;
  }, [localRequestId, existingRequestId, initialRequestId]);

  return {
    requestId,
    localRequestId,
    setLocalRequestId,
  };
};

