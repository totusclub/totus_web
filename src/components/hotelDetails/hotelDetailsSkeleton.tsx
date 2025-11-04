import styles from './hotelDetails.module.css';

const HotelDetailsSkeleton = () => {
  return (
    <div className={'content'}>
      {/* Header Skeleton */}
      <div className={styles.HotelDetailsHeader}>
        <div className={styles.hotelStart}>
          <div className={styles.animationTextlazy} style={{ width: '120px', height: '20px' }}></div>
        </div>
        <div className={styles.animationTextlazy} style={{ width: '60%', height: '32px', marginTop: '8px' }}></div>
        <div className={styles.animationTextlazy2} style={{ width: '40%', height: '16px', marginTop: '8px' }}></div>
        <div className={styles.animationTextlazy2} style={{ width: '80%', height: '16px', marginTop: '8px' }}></div>
      </div>

      {/* Info Row Skeleton */}
      <div className={styles.HotelDetailsInfoRow}>
        {/* Image Skeleton */}
        <div className={styles.image_placeholder}></div>

        {/* Info Skeleton */}
        <div className={styles.HotelDetailsInfo}>
          <div className={styles.HotelDetailsInfoPrice}>
            <div className={styles.animationTextlazy1}></div>
            <div className={styles.animationTextlazy2}></div>
            <div className={styles.animationButtonLazy}></div>
          </div>
          <div className={styles.HotelDetailsInfoMessage}>
            <div className={styles.animationTextlazy} style={{ width: '100%', height: '60px' }}></div>
          </div>
        </div>
      </div>

      {/* Description Skeleton */}
      <div className={styles.HotelDetailsDesc}>
        <div className={styles.HotelDetailsDescHead}>
          <div className={styles.animationTextlazy} style={{ width: '200px', height: '20px' }}></div>
        </div>
        <div className={styles.HotelDetailsDescItems}>
          <div className={styles.animationTaglazy} style={{ width: '80px', height: '24px' }}></div>
          <div className={styles.animationTaglazy} style={{ width: '100px', height: '24px' }}></div>
          <div className={styles.animationTaglazy} style={{ width: '90px', height: '24px' }}></div>
        </div>
        <div className={styles.HotelDetailsDescText}>
          <div className={styles.animationTextlazy} style={{ width: '100%', height: '16px' }}></div>
          <div className={styles.animationTextlazy} style={{ width: '80%', height: '16px', marginTop: '8px' }}></div>
        </div>
      </div>
    </div>
  );
};

export default HotelDetailsSkeleton;
