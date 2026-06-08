import React from 'react';
import AppModal from '@/components/UI/modal';
import styles from './hotelReviewsModal.module.css';
import { HotelReview } from '@/api/levelTravelApi';

interface HotelReviewsModalProps {
    isOpen: boolean;
    onClose: () => void;
    reviews: HotelReview[];
    loading: boolean;
    loadingMore: boolean;
    hasMore: boolean;
    error: string | null;
    reviewsCount: number;
    rating: number;
    onLoadMore: () => void;
}

function formatReviewDate(dateStr: string): string {
    try {
        return new Date(dateStr).toLocaleDateString('ru-RU', {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
        });
    } catch {
        return dateStr;
    }
}

const HotelReviewsModal: React.FC<HotelReviewsModalProps> = ({
    isOpen,
    onClose,
    reviews,
    loading,
    loadingMore,
    hasMore,
    error,
    reviewsCount,
    rating,
    onLoadMore,
}) => {
    const subTitle =
        reviewsCount > 0
            ? `${reviewsCount} отзывов${rating > 0 ? ` · рейтинг ${rating}` : ''}`
            : undefined;

    return (
        <AppModal
            isOpen={isOpen}
            onClose={onClose}
            onBack={onClose}
            title="Отзывы"
            subTitle={subTitle}
            width="600px"
        >
            <div className={styles.reviewsModalContent}>
                {loading && reviews.length === 0 ? (
                    <p className={styles.statusText}>Загрузка отзывов...</p>
                ) : error ? (
                    <p className={styles.statusText}>{error}</p>
                ) : reviews.length === 0 ? (
                    <p className={styles.statusText}>Нет отзывов</p>
                ) : (
                    <>
                        {reviews.map((review) => (
                            <div key={review.id} className={styles.reviewCard}>
                                <div className={styles.reviewHeader}>
                                    {review.avatar_url ? (
                                        <img
                                            src={review.avatar_url}
                                            alt={review.name}
                                            className={styles.avatar}
                                        />
                                    ) : (
                                        <div className={styles.avatarPlaceholder} />
                                    )}
                                    <div className={styles.reviewMeta}>
                                        <div className={styles.reviewAuthorRow}>
                                            <span className={styles.authorName}>{review.name}</span>
                                            {review.average_rating > 0 && (
                                                <span className={styles.ratingBadge}>
                                                    {review.average_rating}
                                                </span>
                                            )}
                                        </div>
                                        {review.title && (
                                            <p className={styles.reviewTitle}>{review.title}</p>
                                        )}
                                        <p className={styles.reviewDate}>
                                            {formatReviewDate(review.created_at)}
                                        </p>
                                    </div>
                                </div>
                                <p className={styles.reviewContent}>{review.content}</p>
                                {review.answer && (
                                    <div className={styles.hotelAnswer}>
                                        <p className={styles.answerLabel}>Ответ отеля</p>
                                        <p className={styles.answerText}>{review.answer}</p>
                                    </div>
                                )}
                            </div>
                        ))}
                        {hasMore && (
                            <button
                                type="button"
                                className={styles.loadMoreBtn}
                                onClick={onLoadMore}
                                disabled={loadingMore}
                            >
                                {loadingMore ? 'Загрузка...' : 'Показать ещё'}
                            </button>
                        )}
                    </>
                )}
            </div>
        </AppModal>
    );
};

export default HotelReviewsModal;
