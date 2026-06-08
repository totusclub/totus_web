import styles from '../hotelDetails.module.css';
import reviewStyles from '../hotelReviewsModal.module.css';
import Icon from "@/components/icons/Icon";
import { useTheme } from "@/hooks/useTheme";

const HotelDetailsHeader = ({ info, loading, onReviewsClick }: any) => {
    const { theme, mounted } = useTheme();

    const iconColor = mounted ? (theme === 'dark' ? '#fff' : '#000') : '#000';
    const reviewsCount = info?.reviews_count ?? 0;
    const hasReviews = reviewsCount > 0;

    if (!loading) {
        return (
            <div className={'content'}>
                <div className={styles.HotelDetailsHeader}>
                    <div className={styles.HotelDetailsHeaderRow}>
                        <div className={styles.hotelStart}>
                            <Icon name={'star'} size={18}
                                color={info?.stars >= 1 ? 'var(--core_Orange)' : 'var(--bgSecondary)'} />
                            <Icon name={'star'} size={18}
                                color={info?.stars >= 2 ? 'var(--core_Orange)' : 'var(--bgSecondary)'} />
                            <Icon name={'star'} size={18}
                                color={info?.stars >= 3 ? 'var(--core_Orange)' : 'var(--bgSecondary)'} />
                            <Icon name={'star'} size={18}
                                color={info?.stars >= 4 ? 'var(--core_Orange)' : 'var(--bgSecondary)'} />
                            <Icon name={'star'} size={18}
                                color={info?.stars >= 5 ? 'var(--core_Orange)' : 'var(--bgSecondary)'} />
                        </div>
                    </div>
                    <p className={styles.HotelDetailsHeaderName}>{info?.name}</p>
                    <div className={styles.hotelCardImageInfo}>
                        {info?.rating > 0 && (
                            <p>{info?.rating}</p>
                        )}
                        <p
                            className={onReviewsClick ? reviewStyles.reviewsClickable : undefined}
                            onClick={onReviewsClick}
                            role={onReviewsClick ? 'button' : undefined}
                            tabIndex={onReviewsClick ? 0 : undefined}
                            onKeyDown={
                                onReviewsClick
                                    ? (e) => { if (e.key === 'Enter' || e.key === ' ') onReviewsClick(); }
                                    : undefined
                            }
                        >
                            <Icon name={'message'} size={14} color={iconColor} />
                            {' '}
                            {hasReviews ? `${reviewsCount} отзывов` : 'Отзывы'}
                        </p>
                    </div>
                    <p className={styles.HotelDetailsHeaderAddress}>{info?.address}</p>
                </div>
            </div>
        );
    } else {
        return (
            <div className={'content'}>
                <div className={styles.HotelDetailsHeader}>
                    <div className={styles.hotelStart}>
                        <Icon name={'star'} size={18} color={'#dcdcdc'} />
                        <Icon name={'star'} size={18} color={'#dcdcdc'} />
                        <Icon name={'star'} size={18} color={'#dcdcdc'} />
                        <Icon name={'star'} size={18} color={'#dcdcdc'} />
                        <Icon name={'star'} size={18} color={'#dcdcdc'} />
                    </div>
                    <div className={styles.animationTextlazy}></div>
                    <div className={styles.animationTextlazy2}></div>
                </div>
            </div>
        );
    }

};

export default HotelDetailsHeader;
