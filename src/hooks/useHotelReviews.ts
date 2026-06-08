import { useCallback, useEffect, useRef, useState } from 'react';
import { getHotelReviews, HotelReview } from '@/api/levelTravelApi';

const PER_PAGE = 10;

export function useHotelReviews(hotelId: string | number | null | undefined, isReady = true) {
    const [reviews, setReviews] = useState<HotelReview[]>([]);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(false);
    const [loading, setLoading] = useState(false);
    const [loadingMore, setLoadingMore] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [hotelRating, setHotelRating] = useState<number | null>(null);
    const fetchedForHotelRef = useRef<string | null>(null);

    const fetchPage = useCallback(
        async (pageNum: number, append: boolean) => {
            if (!hotelId) return;

            if (append) {
                setLoadingMore(true);
            } else {
                setLoading(true);
            }
            setError(null);

            try {
                const data = await getHotelReviews({
                    hotel_id: hotelId,
                    page: pageNum,
                    per_page: PER_PAGE,
                });

                if (data.success) {
                    setHotelRating(data.hotel?.rating ?? null);
                    const newReviews = data.reviews ?? [];
                    setReviews((prev) => (append ? [...prev, ...newReviews] : newReviews));
                    setHasMore(newReviews.length >= PER_PAGE);
                    setPage(pageNum);
                } else {
                    setError('Не удалось загрузить отзывы');
                }
            } catch {
                setError('Не удалось загрузить отзывы');
            } finally {
                setLoading(false);
                setLoadingMore(false);
            }
        },
        [hotelId],
    );

    useEffect(() => {
        if (!isReady || !hotelId) return;

        const hotelKey = String(hotelId);
        if (fetchedForHotelRef.current === hotelKey) return;

        fetchedForHotelRef.current = hotelKey;
        setReviews([]);
        setPage(1);
        setHasMore(false);
        setHotelRating(null);
        setError(null);
        fetchPage(1, false);
    }, [hotelId, isReady, fetchPage]);

    const loadMore = useCallback(() => {
        if (!loadingMore && hasMore) {
            fetchPage(page + 1, true);
        }
    }, [fetchPage, page, hasMore, loadingMore]);

    return { reviews, loading, loadingMore, hasMore, error, hotelRating, loadMore };
}
