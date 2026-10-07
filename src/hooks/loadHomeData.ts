import { useEffect, useState } from 'react';
import { getHomeData } from '../api/levelTravelApi';

export type HomeDataPayload = {
  recommendedTitle?: string;
  destinationsTitle?: string;
  popularDestinations?: any[];
  recomendHotels?: any[];
};

/** initial — данные с сервера (getServerSideProps главной); если они есть, повторного запроса нет. */
export const useLoadHomeData = (initial: HomeDataPayload | null = null) => {
  const [homeData, setHomeData] = useState<HomeDataPayload | null>(initial);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (initial) return;
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
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return { homeData, loading, error };
};