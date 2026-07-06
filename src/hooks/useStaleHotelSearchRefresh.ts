import { useCallback, useRef } from 'react';
import { useRouter } from 'next/router';
import {
    buildHotelSearchQueryUpdate,
    createHotelSearchRequest,
} from '@/utils/hotelSearchRefresh';

type UseStaleHotelSearchRefreshArgs = {
    hotelId: string | undefined;
    isReady: boolean;
    setLocalRequestId: (id: string) => void;
    onSearchRefreshed?: () => void;
};

/**
 * Starts a new hotel search when the current request_id is expired or invalid.
 */
export function useStaleHotelSearchRefresh({
    hotelId,
    isReady,
    setLocalRequestId,
    onSearchRefreshed,
}: UseStaleHotelSearchRefreshArgs) {
    const router = useRouter();
    const refreshInFlightRef = useRef(false);
    const attemptedRequestIdsRef = useRef<Set<string>>(new Set());
    const totalRefreshAttemptsRef = useRef(0);
    const MAX_REFRESH_ATTEMPTS = 2;

    const handleStaleRequestId = useCallback(
        async (failedRequestId: string) => {
            if (!isReady || !hotelId) return;
            if (refreshInFlightRef.current) return;
            if (attemptedRequestIdsRef.current.has(failedRequestId)) return;
            if (totalRefreshAttemptsRef.current >= MAX_REFRESH_ATTEMPTS) {
                console.warn('[useStaleHotelSearchRefresh] Max refresh attempts reached');
                return;
            }

            refreshInFlightRef.current = true;
            attemptedRequestIdsRef.current.add(failedRequestId);
            totalRefreshAttemptsRef.current += 1;

            try {
                const newRequestId = await createHotelSearchRequest(router.query, hotelId);
                if (!newRequestId || newRequestId === failedRequestId) return;

                setLocalRequestId(newRequestId);
                onSearchRefreshed?.();

                const newQuery = buildHotelSearchQueryUpdate(
                    router.query,
                    hotelId,
                    newRequestId,
                );

                await router.replace(
                    { pathname: router.pathname, query: newQuery },
                    undefined,
                    { shallow: true },
                );
            } catch (error) {
                console.error('[useStaleHotelSearchRefresh] Failed to create new request_id', error);
            } finally {
                refreshInFlightRef.current = false;
            }
        },
        [hotelId, isReady, onSearchRefreshed, router, setLocalRequestId],
    );

    return handleStaleRequestId;
}
