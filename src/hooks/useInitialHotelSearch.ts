import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { startSearch } from '@/api/levelTravelApi';
import { buildInitialSearchParams } from '@/utils/hotelDetailsUtils';

/**
 * Runs startSearch when there is a hotel_id but no request_id yet.
 * `buildInitialSearchParams` fills defaults (dates, Moscow, adults, …) so deep links work:
 * favorites, share, refresh on `/hotel-details?hotel_id=…` only.
 */
export const useInitialHotelSearch = (
  hotelId: string | undefined,
  requestId: string | null | undefined,
  localRequestId: string | null,
  isReady: boolean,
  setLocalRequestId: (id: string) => void
): void => {
  const router = useRouter();

  useEffect(() => {
    if (!isReady || !hotelId) return;

    const query = router.query;
    const currentFlexDates = Array.isArray(query.flex_dates)
      ? query.flex_dates[0]
      : query.flex_dates;
    const needsForcedHotelFlex = String(currentFlexDates ?? '') !== '2';

    if ((requestId || localRequestId) && !needsForcedHotelFlex) {
      return;
    }

    let isMounted = true;

    const runInitialSearch = async () => {
      try {
        const searchParams = buildInitialSearchParams(query, hotelId);
        const response = await startSearch(searchParams);

        if (isMounted && response?.request_id) {
          setLocalRequestId(response.request_id);

          const newQuery: Record<string, string | string[] | undefined> = {
            ...query,
            request_id: response.request_id,
          };
          if (!newQuery.start_date && searchParams.start_date) {
            newQuery.start_date = String(searchParams.start_date);
          }
          if (!newQuery.start_date_from && searchParams.start_date_from) {
            newQuery.start_date_from = String(searchParams.start_date_from);
          }
          if (!newQuery.end_date_till && searchParams.end_date_till) {
            newQuery.end_date_till = String(searchParams.end_date_till);
          }
          if (!newQuery.nights && searchParams.nights) {
            newQuery.nights = String(searchParams.nights);
          }
          if (!newQuery.from_city && searchParams.from_city) {
            newQuery.from_city = String(searchParams.from_city);
          }
          if (!newQuery.from_country && searchParams.from_country) {
            newQuery.from_country = String(searchParams.from_country);
          }
          if (!newQuery.adults && searchParams.adults) {
            newQuery.adults = String(searchParams.adults);
          }
          if (!newQuery.search_type && searchParams.search_type) {
            newQuery.search_type = String(searchParams.search_type);
          }
          if (searchParams.flex_dates != null) {
            // Keep hotel page URL consistent with forced room-search flexibility.
            newQuery.flex_dates = String(searchParams.flex_dates);
          }

          router.replace({ pathname: router.pathname, query: newQuery }, undefined, { shallow: true });
        }
      } catch (error) {
        console.error("[useInitialHotelSearch] Failed to start hotel search", error);
      }
    };

    runInitialSearch();

    return () => {
      isMounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isReady, hotelId, requestId, localRequestId, setLocalRequestId]);
};

