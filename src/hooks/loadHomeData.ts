import { useEffect, useState } from 'react';
import { getHomeData } from '../api/levelTravelApi';

export type HomeDataPayload = {
  recommendedTitle?: string;
  destinationsTitle?: string;
  popularDestinations?: any[];
  recomendHotels?: any[];
};

export const useLoadHomeData = () => {
  const [homeData, setHomeData] = useState<HomeDataPayload | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let isMounted = true;

    const load = async () => {
      try {
        setLoading(true);
        const data = await getHomeData();
        if (isMounted) {
          setHomeData(data);
        }
      } catch (err) {
        if (isMounted) {
          setError(err as Error);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    load();

    return () => {
      isMounted = false;
    };
  }, []);

  return { homeData, loading, error };
};