import styles from './selectedtour.module.css';
import Icon from "@/components/icons/Icon";
import TourModel from "@/components/modals/tourModal";
import { useEffect, useState } from "react";




const SelectedTour = ({ packages }: any) => {
    const [open, setOpen] = useState(false);

    const [timeLeft, setTimeLeft] = useState(15 * 60); // 15 minutes in seconds

    useEffect(() => {
        const timer = setInterval(() => {
            setTimeLeft(prev => {
                if (prev <= 1) {
                    clearInterval(timer);
                    window.location.reload();
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(timer); // Cleanup
    }, []);
    const formatTime = (seconds) => {
        const m = String(Math.floor(seconds / 60)).padStart(2, '0');
        const s = String(seconds % 60).padStart(2, '0');
        return `${m}:${s}`;
    };

    if (packages) {
        return (
            <>
                <div className={styles.selectedTour}>
                    <div className={styles.selectedTourHead}>
                        <div className={styles.selectedTourCheck}>
                            <Icon name={'check'} size={24} color={'var(--secondary_green)'} />
                            <p>Выбранный тур</p>
                        </div>
                        <div onClick={() => setOpen(true)} className={styles.selectedTourMore}>
                            <Icon name={'info'} size={16} />
                            <p>Подробнее</p>
                        </div>
                    </div>
                    <div className={styles.selectedTourBody}>
                        {/* Hotel Room Image - 223px × 160px */}
                        <div className={styles.selectedTourImage} style={{ backgroundImage: `url(${packages?.room_info?.images?.[0]?.['x260x150']})` }}>
                        </div>

                        {/* Hotel Information Section */}
                        <div className={styles.selectedTourInfo}>
                            {/* Hotel Star Rating (1-5 stars) */}
                            <div className={styles.hotelStart}>
                                <Icon name={'star'} size={18}
                                    color={packages?.hotel?.stars >= 1 ? 'var(--core_Orange)' : 'var(--bgSecondary)'} />
                                <Icon name={'star'} size={18}
                                    color={packages?.hotel?.stars >= 2 ? 'var(--core_Orange)' : 'var(--bgSecondary)'} />
                                <Icon name={'star'} size={18}
                                    color={packages?.hotel?.stars >= 3 ? 'var(--core_Orange)' : 'var(--bgSecondary)'} />
                                <Icon name={'star'} size={18}
                                    color={packages?.hotel?.stars >= 4 ? 'var(--core_Orange)' : 'var(--bgSecondary)'} />
                                <Icon name={'star'} size={18}
                                    color={packages?.hotel?.stars >= 5 ? 'var(--core_Orange)' : 'var(--bgSecondary)'} />
                            </div>

                            {/* Hotel Name */}
                            <p className={styles.selectedTourName}>{packages?.hotel?.name}</p>

                            {/* Adults Count Info */}
                            <div className={styles.selectedTourList}>
                                <Icon name={'user'} size={16} />
                                <p>{packages?.adults_count} взрослых</p>
                            </div>

                            {/* Tour Operator Info */}
                            <div className={styles.selectedTourList}>
                                <Icon name={'eays'} size={16} />
                                <p>{packages?.operator?.name}</p>
                            </div>

                            {/* Room Type & Meal Plan Info */}
                            <div className={styles.selectedTourList}>
                                <Icon name={'hotel'} size={16} />
                                <p>{packages?.room_info?.name_ru}, «{packages?.pansion_description}»</p>
                            </div>
                        </div>

                        {/* Price & Booking Section */}
                        <div className={styles.actualePackage}>
                            {/* Price Guarantee Text with Help Icon */}
                            <p className={styles.actualePackageLable}>Гарантия лучшей цены <Icon name={'help'} size={14} /></p>

                            {/* Total Price (price + surcharge) */}
                            <p className={styles.actualePackageTotal}>{(packages?.price + packages?.predicted_surcharge).toString().replace(/\B(?=(\d{3})+(?!\d))/g, '\u202F')}₽</p>

                            {/* Price Comparison (old price → new price) */}
                            <div className={styles.actualePackageParices}>
                                <del>{(packages?.price + packages?.predicted_surcharge).toString().replace(/\B(?=(\d{3})+(?!\d))/g, '\u202F')}₽</del>

                                <Icon name={'prev'} size={16} />
                                {/* Old Price (crossed out) */}
                                <p>{packages?.price.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '\u202F')}₽</p>
                                {/* Arrow Icon */}

                                {/* New Price */}

                            </div>

                            {/* Additional Fees Text */}
                            <p className={styles.feesText}>Доплаты и сборы +{packages?.predicted_surcharge.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '\u202F')}₽</p>

                            {/* Price Check Countdown Timer */}
                            <div className={styles.timeDown}>
                                {/* "Проверка цены через" text */}
                                <p>Проверка цены через</p>
                                {/* Clock Icon */}
                                <Icon name={'time'} size={14} />
                                {/* Timer (MM:SS) */}
                                <p>{formatTime(timeLeft)}</p>
                            </div>
                        </div>
                    </div>
                </div>
                <TourModel packages={packages} open={open} setOpen={setOpen} />
            </>
        );
    } else {
        return (
            <div className={styles.selectedTour}>
                {/* Header Section */}
                <div className={styles.selectedTourHead}>
                    <div className={styles.selectedTourCheck}>
                        <div className={styles.animationImagelazy} style={{ width: '24px', height: '24px' }}></div>
                        <div className={styles.animationTextlazy} style={{ width: '120px', height: '20px' }}></div>
                    </div>
                    <div className={styles.selectedTourMore}>
                        <div className={styles.animationImagelazy} style={{ width: '16px', height: '16px' }}></div>
                        <div className={styles.animationTextlazy} style={{ width: '80px', height: '16px' }}></div>
                    </div>
                </div>

                {/* Body Section */}
                <div className={styles.selectedTourBody}>
                    {/* Hotel Room Image - 223px × 160px */}
                    <div className={styles.selectTourLazyImage}></div>

                    {/* Hotel Info Section - flex: 1 */}
                    <div className={styles.selectedTourInfo}>
                        {/* Hotel Star Rating (1-5 stars) */}
                        <div className={styles.hotelStart}>
                            <Icon name={'star'} size={18} color={'#dcdcdc'} />
                            <Icon name={'star'} size={18} color={'#dcdcdc'} />
                            <Icon name={'star'} size={18} color={'#dcdcdc'} />
                            <Icon name={'star'} size={18} color={'#dcdcdc'} />
                            <Icon name={'star'} size={18} color={'#dcdcdc'} />
                        </div>

                        {/* Hotel Name */}
                        <div className={styles.selectedTourName}>
                            <div className={styles.animationTextlazy} style={{ width: '85%', height: '24px' }}></div>
                        </div>

                        {/* Adults Count Info */}
                        <div className={styles.selectedTourList}>
                            <div className={styles.animationImagelazy} style={{ width: '16px', height: '16px' }}></div>
                            <div className={styles.animationTextlazy} style={{ width: '100px', height: '18px' }}></div>
                        </div>

                        {/* Tour Operator Info */}
                        <div className={styles.selectedTourList}>
                            <div className={styles.animationImagelazy} style={{ width: '16px', height: '16px' }}></div>
                            <div className={styles.animationTextlazy} style={{ width: '120px', height: '18px' }}></div>
                        </div>

                        {/* Room Type & Meal Plan Info */}
                        <div className={styles.selectedTourList}>
                            <div className={styles.animationImagelazy} style={{ width: '16px', height: '16px' }}></div>
                            <div className={styles.animationTextlazy} style={{ width: '180px', height: '18px' }}></div>
                        </div>
                    </div>

                    {/* Price & Booking Section */}
                    <div className={styles.actualePackage}>
                        {/* Top Section - Price Guarantee */}
                        <div className={styles.animationTextlazy} style={{ width: '160px', height: '18px', marginBottom: '8px' }}></div>

                        {/* Middle Section - Total Price */}
                        <div className={styles.animationTextlazy} style={{ width: '120px', height: '24px', marginBottom: '8px' }}></div>

                        {/* Bottom Section - Price Details */}
                        <div className={styles.animationTextlazy} style={{ width: '200px', height: '18px' }}></div>
                    </div>
                </div>
            </div>
        )
    }

};

export default SelectedTour;
