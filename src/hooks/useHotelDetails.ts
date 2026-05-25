import { useState, useEffect } from 'react';
import { getHotelInfo } from '@/api/levelTravelApi';
import { parseHotelId } from '@/utils/hotelDetailsUtils';
import type { SearchTypeValue } from '@/utils/bookingFlowUtils';

interface UseHotelDetailsResult {
  hotel: any;
  apiHotelData: any;
  loading: boolean;
  error: string | null;
}

/**
 * Hook to fetch hotel details by hotel ID
 */
export const useHotelDetails = (
  hotelId: string | undefined,
  isReady: boolean,
  searchType: SearchTypeValue = 'package'
): UseHotelDetailsResult => {
  const [hotel, setHotel] = useState<any>(null);
  const [apiHotelData, setApiHotelData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchHotelData = async () => {
      try {
        setLoading(true);
        setError(null);

        const parsedHotelId = parseHotelId(hotelId);
        if (!parsedHotelId) {
          console.warn('[useHotelDetails] Invalid hotel ID');
          setLoading(false);
          return;
        }

        const hotelInfo = await getHotelInfo({
          hotel_id: parsedHotelId,
          search_type: searchType,
        });
        setApiHotelData(hotelInfo);
        setHotel(hotelInfo);
      } catch (err: any) {
        console.error('[useHotelDetails] Error fetching hotel data:', err);
        setError(err.message || 'Failed to fetch hotel data');
      } finally {
        setLoading(false);
      }
    };

    if (isReady && hotelId) {
      fetchHotelData();
    }
  }, [isReady, hotelId, searchType]);

  return { hotel, apiHotelData, loading, error };
};

