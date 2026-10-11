import styles from './selectedtour.module.css';
import Icon from "@/components/icons/Icon";
import TourModel from "@/components/modals/tourModal";
import { useEffect, useMemo, useState } from "react";
import {
    formatMoneyRub,
    getMinFlightOfferTotal,
    getPackageBasePrice,
    toMoney,
} from '@/utils/packagePrice';
import { formatAdultsCountWithDates } from '@/utils/formatRussianPlural';

const formatTourPrice = (amount: number) => formatMoneyRub(amount);

const SelectedTour = ({ packages, flights }: any) => {
    const [open, setOpen] = useState(false);
    const [initialTotal, setInitialTotal] = useState<number | null>(null);
    const [timeLeft, setTimeLeft] = useState(15 * 60);

    const { totalPrice, fees, oldTotal, showPriceComparison } = useMemo(() => {
        const basePrice = getPackageBasePrice(packages);
        const fromFlights =
            Array.isArray(flights) && flights.length > 0
                ? getMinFlightOfferTotal(basePrice, flights)
                : basePrice + toMoney(packages?.predicted_surcharge);
        const total = fromFlights;
        const feeAmount = Math.max(0, total - basePrice);

        const apiOldCandidates = [
            packages?.crossed_price,
            packages?.old_price,
            packages?.initial_price,
            packages?.price_before,
        ]
            .map((value) => Number(value))
            .filter((value) => Number.isFinite(value) && value > 0);

        const apiOldTotal = apiOldCandidates.find((value) => value !== total) ?? null;
        const initialOldTotal =
            initialTotal != null && initialTotal !== total ? initialTotal : null;
        const previousTotal = apiOldTotal ?? initialOldTotal;

        return {
            totalPrice: total,
            fees: feeAmount,
            oldTotal: previousTotal,
            showPriceComparison: previousTotal != null && previousTotal !== total,
        };
    }, [packages, flights, initialTotal]);

    useEffect(() => {
        if (!packages) return;
        setInitialTotal((prev) => (prev == null ? totalPrice : prev));
    }, [packages, totalPrice]);

    useEffect(() => {
        const timer = setInterval(() => {
            setTimeLeft((prev) => {
                if (prev <= 1) {
                    clearInterval(timer);
                    window.location.reload();
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(timer);
    }, []);

    const formatTime = (seconds: number) => {
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
                        <div
                            className={styles.selectedTourImage}
                            style={{
                                backgroundImage: `url(${packages?.room_info?.images?.[0]?.['x260x150']})`,
                            }}
                        />

                        <div className={styles.selectedTourInfo}>
                            <div className={styles.hotelStart}>
                                {[1, 2, 3, 4, 5].map((star) => (
                                    <Icon
                                        key={star}
                                        name={'star'}
                                        size={18}
                                        color={
                                            packages?.hotel?.stars >= star
                                                ? 'var(--core_Orange)'
                                                : 'var(--bgSecondary)'
                                        }
                                    />
                                ))}
                            </div>

                            <p className={styles.selectedTourName}>{packages?.hotel?.name}</p>

                            <div className={styles.selectedTourList}>
                                <Icon name={'user'} size={16} />
                                <p>{formatAdultsCountWithDates(packages)}</p>
                            </div>

                            <div className={styles.selectedTourList}>
                                <Icon name={'eays'} size={16} />
                                <p>{packages?.operator?.name}</p>
                            </div>

                            <div className={styles.selectedTourList}>
                                <Icon name={'hotel'} size={16} />
                                <p>
                                    {packages?.room_info?.name_ru}, «{packages?.pansion_description}»
                                </p>
                            </div>
                        </div>

                        <div className={styles.actualePackage}>
                            <p className={styles.actualePackageLable}>
                                Гарантия лучшей цены <Icon name={'help'} size={14} />
                            </p>

                            <p className={styles.actualePackageTotal}>
                                {Array.isArray(flights) && flights.length > 0 ? 'от ' : ''}
                                {formatTourPrice(totalPrice)}
                            </p>

                            {/* {showPriceComparison && oldTotal != null && (
                                <div className={styles.actualePackageParices}>
                                    <del>{formatTourPrice(oldTotal)}</del>
                                    <Icon name={'prev'} size={16} />
                                    <p>{formatTourPrice(totalPrice)}</p>
                                </div>
                            )} */}

                            <p className={styles.feesText}>
                                Доплаты и сборы +{formatTourPrice(fees)}
                            </p>

                            <div className={styles.timeDown}>
                                <p>Проверка цены через</p>
                                <Icon name={'time'} size={14} />
                                <p>{formatTime(timeLeft)}</p>
                            </div>
                        </div>
                    </div>
                </div>
                <TourModel packages={packages} open={open} setOpen={setOpen} />
            </>
        );
    }

    return (
        <div className={styles.selectedTour}>
            <div className={styles.selectedTourHead}>
                <div className={styles.selectedTourCheck}>
                    <div className={styles.animationImagelazy} style={{ width: '24px', height: '24px' }} />
                    <div className={styles.animationTextlazy} style={{ width: '120px', height: '20px' }} />
                </div>
                <div className={styles.selectedTourMore}>
                    <div className={styles.animationImagelazy} style={{ width: '16px', height: '16px' }} />
                    <div className={styles.animationTextlazy} style={{ width: '80px', height: '16px' }} />
                </div>
            </div>

            <div className={styles.selectedTourBody}>
                <div className={styles.selectTourLazyImage} />
                <div className={styles.selectedTourInfo}>
                    <div className={styles.hotelStart}>
                        {[1, 2, 3, 4, 5].map((star) => (
                            <Icon key={star} name={'star'} size={18} color={'var(--bgSecondary)'} />
                        ))}
                    </div>
                    <div className={styles.selectedTourName}>
                        <div className={styles.animationTextlazy} style={{ width: '85%', height: '24px' }} />
                    </div>
                    <div className={styles.selectedTourList}>
                        <div className={styles.animationImagelazy} style={{ width: '16px', height: '16px' }} />
                        <div className={styles.animationTextlazy} style={{ width: '100px', height: '18px' }} />
                    </div>
                    <div className={styles.selectedTourList}>
                        <div className={styles.animationImagelazy} style={{ width: '16px', height: '16px' }} />
                        <div className={styles.animationTextlazy} style={{ width: '120px', height: '18px' }} />
                    </div>
                    <div className={styles.selectedTourList}>
                        <div className={styles.animationImagelazy} style={{ width: '16px', height: '16px' }} />
                        <div className={styles.animationTextlazy} style={{ width: '180px', height: '18px' }} />
                    </div>
                </div>
                <div className={styles.actualePackage}>
                    <div className={styles.animationTextlazy} style={{ width: '160px', height: '18px', marginBottom: '8px' }} />
                    <div className={styles.animationTextlazy} style={{ width: '120px', height: '24px', marginBottom: '8px' }} />
                    <div className={styles.animationTextlazy} style={{ width: '200px', height: '18px' }} />
                </div>
            </div>
        </div>
    );
};

export default SelectedTour;
