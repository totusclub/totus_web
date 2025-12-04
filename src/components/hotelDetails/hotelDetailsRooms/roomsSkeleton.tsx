import styles from '../hotelDetails.module.css';

const RoomsSkeleton = () => {
  return (
    <div className={'content'}>
      <div className={styles.HotelDetailsRoomsRow}>
        <div className={styles.HotelDetailsRooms}>
          {/* Header Skeleton */}
          <div className={styles.HotelDetailsRoomsHead}>
            <div className={styles.animationTextlazy} style={{ width: '200px', height: '20px' }}></div>
          </div>

          {/* Dates Price Skeleton */}
          <div className={styles.HotelDetailsDatePrices}>
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className={styles.HotelDetailsDatePrice}>
                <div className={styles.animationTextlazy} style={{ width: '60px', height: '20px' }}></div>
                <div className={styles.animationTextlazy2} style={{ width: '80px', height: '14px', marginTop: '4px' }}></div>
              </div>
            ))}
          </div>

          {/* Room Items Skeleton */}
          {[1, 2, 3].map((i) => (
            <div key={i} className={styles.HotelDetailsRoomItem}>
              <div className={styles.HotelDetailsRoom}>
                {/* Room Image Skeleton */}
                <div className={styles.HotelDetailsRoomImage}>
                  <div className={styles.image_placeholder} style={{ width: '279px', height: '200px' }}></div>
                </div>

                {/* Room Info Skeleton */}
                <div className={styles.HotelDetailsRoomInforamation}>
                  <div className={styles.animationTextlazy} style={{ width: '70%', height: '24px' }}></div>
                  <div className={styles.animationTextlazy2} style={{ width: '50%', height: '16px', marginTop: '8px' }}></div>
                  
                  {/* Room Options Skeleton */}
                  <div className={styles.HotelDetailsRoomOptions}>
                    {[1, 2, 3].map((j) => (
                      <div key={j} className={styles.animationTextlazy2} style={{ width: '120px', height: '14px', marginTop: '4px' }}></div>
                    ))}
                  </div>

                  {/* Facilities Skeleton */}
                  <div className={styles.HotelDetailsRoomfacilities}>
                    {[1, 2, 3, 4].map((j) => (
                      <div key={j} className={styles.animationTaglazy} style={{ width: '60px', height: '24px' }}></div>
                    ))}
                  </div>
                </div>

                {/* Price List Skeleton */}
                <div className={styles.HotelDetailsPriceList}>
                  <div className={styles.HotelDetailsPriceListHead}>
                    <div className={styles.animationTextlazy} style={{ width: '100px', height: '18px' }}></div>
                    <div className={styles.animationTextlazy2} style={{ width: '80px', height: '16px', marginTop: '4px' }}></div>
                  </div>
                  <div className={styles.HotelDetailsPriceListItems}>
                    {[1, 2, 3].map((j) => (
                      <div key={j} className={styles.HotelDetailsPriceListItem}>
                        <div>
                          <div className={styles.animationTextlazy} style={{ width: '80px', height: '20px' }}></div>
                          <div className={styles.animationTextlazy2} style={{ width: '60px', height: '18px', marginTop: '4px' }}></div>
                        </div>
                        <div>
                          <div className={styles.animationTextlazy} style={{ width: '100px', height: '20px' }}></div>
                          <div className={styles.animationTextlazy2} style={{ width: '80px', height: '18px', marginTop: '4px' }}></div>
                        </div>
                        <div>
                          <div className={styles.animationTextlazy} style={{ width: '120px', height: '20px' }}></div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Map and Price Box Skeleton */}
        <div className={styles.HotelDetailsMap}>
          <div className={styles.HotelDetailsMapBox}>
            <div className={styles.HotelDetailsMapBoxTitle}>
              <div className={styles.animationTextlazy} style={{ width: '200px', height: '20px' }}></div>
            </div>
            <div className={styles.map}>
              <div className={styles.image_placeholder} style={{ width: '100%', height: '184px' }}></div>
            </div>
          </div>
          <div className={styles.HotelDetailsInfoPrice}>
            <div className={styles.animationTextlazy1}></div>
            <div className={styles.animationTextlazy2}></div>
            <div className={styles.animationButtonLazy}></div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RoomsSkeleton;

