import styles from './booking.module.css';
import Button from "@/components/UI/button";
import Icon from "@/components/icons/Icon";
import { useMemo } from "react";
import { formatMoneyRub, getBookingPriceBreakdown } from "@/utils/packagePrice";
import ConsentCheckbox, {
    ConsentAdsText,
    ConsentGroup,
    ConsentHint,
    ConsentHotelTermsText,
    ConsentPdText,
    ConsentTourOfferText,
} from "@/components/UI/consentCheckbox";
import { hasRequiredConsents, type ConsentKey, type Consents } from "@/config/legalLinks";

/** Обязательные согласия: тур — оферта (п. 1.3: договор заключается отметкой и оплатой), отель — условия размещения. */
export function requiredBookingConsents(isHotelOnly: boolean): ConsentKey[] {
    return isHotelOnly ? ['hotel_terms', 'pd'] : ['tour_offer', 'pd'];
}

type BookingOrderCardProps = {
    packageData: any;
    handleSubmit: () => void;
    loading: boolean;
    dataLoading?: boolean;
    isFormValid: boolean;
    errorMessages?: string[];
    /** Отель без перелёта — не тур: «Отель в …», условия бронирования размещения, «гостей». */
    isHotelOnly?: boolean;
    consents: Consents;
    onConsentsChange: (next: Consents) => void;
};

const BookingOrderCard = ({
    packageData,
    handleSubmit,
    loading,
    dataLoading,
    isFormValid,
    errorMessages = [],
    isHotelOnly = false,
    consents,
    onConsentsChange,
}: BookingOrderCardProps) => {
    const consentsOk = hasRequiredConsents(consents, requiredBookingConsents(isHotelOnly));
    const setConsent = (key: ConsentKey) => (checked: boolean) => onConsentsChange({ ...consents, [key]: checked });
    const formatDate = useMemo(() => {
        if (packageData?.dates_info?.start_date && packageData?.dates_info?.end_date) {
            const startDate = new Date(packageData?.dates_info?.start_date);
            const endDate = new Date(packageData?.dates_info?.end_date);

            const formatterSameMonth = new Intl.DateTimeFormat('ru-RU', {
                day: 'numeric',
                month: 'long',
            });

            const formatterDifferentMonth = new Intl.DateTimeFormat('ru-RU', {
                day: 'numeric',
                month: 'long',
            });

            const sameMonth = startDate.getMonth() === endDate.getMonth();

            return sameMonth
                ? `${startDate.getDate()} ${formatterSameMonth.format(startDate).split(' ')[1]} – ${endDate.getDate()} ${formatterSameMonth.format(endDate).split(' ')[1]}`
                : `${formatterDifferentMonth.format(startDate)} – ${formatterDifferentMonth.format(endDate)}`;
        }
    }, [packageData]);

    // Level Travel only: package.price + (fuel_charge | predicted_surcharge)
    const { basePrice, fees, totalPrice } = useMemo(
        () => getBookingPriceBreakdown(packageData),
        [packageData],
    );

    if (dataLoading || !packageData) {
        return (
            <div className={styles.bookingCardWrap}>
                <div className={styles.bookingCard}>
                    <div className={styles.bookingCardHead}>
                        <p>Ваш заказ</p>
                    </div>
                    <div className={styles.bookingCardInfo}>
                        <div className={styles.bookingCardInfoItem}>
                            <div className={styles.animationTextLazy} style={{ width: '60%', height: '20px' }} />
                            <div className={styles.animationTextLazy} style={{ width: '30%', height: '20px' }} />
                        </div>
                        <div className={styles.bookingCardInfoItem}>
                            <div className={styles.animationTextLazy} style={{ width: '50%', height: '20px' }} />
                        </div>
                    </div>
                    <div className={styles.bookingLine} />
                    <div className={styles.bookingCardPrice}>
                        <p>Итого</p>
                        <div className={styles.animationTextLazy} style={{ width: '30%', height: '24px' }} />
                    </div>
                    <div className={styles.bookingCardFooter}>
                        <div className={styles.ButtonLazy} />
                    </div>
                </div>
                <div className={styles.orderInformation}>
                    <div className={styles.orderInformationHead}>
                        <p>Туры раскупают — цены меняются</p>
                    </div>
                    <div className={styles.orderInformationBody}>
                        <Icon name={'travel'} size={61} />
                        <p>Каждую секунду цены могут меняться</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className={styles.bookingCardWrap}>
            <div className={styles.bookingCard}>
                <div className={styles.bookingCardHead}>
                    <p>Ваш заказ</p>
                </div>
                <div className={styles.bookingCardInfo}>
                    <div className={styles.bookingCardInfoItem}>
                        <p>
                            {isHotelOnly ? 'Отель' : 'Тур'} в {packageData?.hotel?.city}, {packageData?.hotel?.country}
                        </p>
                        <p>{formatMoneyRub(basePrice)}</p>
                    </div>
                    <div className={styles.bookingCardInfoItem}>
                        <p>
                            {formatDate}, на {packageData?.nights_count} ночей
                        </p>
                    </div>
                    {fees > 0 && (
                        <div className={styles.bookingCardInfoItem}>
                            <p>Доплаты и сборы</p>
                            <p>+{formatMoneyRub(fees)}</p>
                        </div>
                    )}
                </div>
                <div className={styles.bookingLine} />
                <div className={styles.bookingCardPrice}>
                    <p>Итого</p>
                    <p>{formatMoneyRub(totalPrice)}</p>
                </div>
                <div className={styles.bookingCardFooter}>
                    <ConsentGroup>
                        {isHotelOnly ? (
                            <ConsentCheckbox id="booking-consent-hotel" checked={consents.hotel_terms === true} onChange={setConsent('hotel_terms')} required>
                                <ConsentHotelTermsText />
                            </ConsentCheckbox>
                        ) : (
                            <ConsentCheckbox id="booking-consent-offer" checked={consents.tour_offer === true} onChange={setConsent('tour_offer')} required>
                                <ConsentTourOfferText />
                            </ConsentCheckbox>
                        )}
                        <ConsentCheckbox id="booking-consent-pd" checked={consents.pd === true} onChange={setConsent('pd')} required>
                            <ConsentPdText subjects={isHotelOnly ? 'guests' : 'tourists'} />
                        </ConsentCheckbox>
                        <ConsentCheckbox id="booking-consent-ads" checked={consents.ads === true} onChange={setConsent('ads')}>
                            <ConsentAdsText />
                        </ConsentCheckbox>
                    </ConsentGroup>
                    <Button
                        loading={loading}
                        onClick={() => handleSubmit()}
                        title={'Отправить запрос'}
                        full={true}
                        disabled={!isFormValid || !consentsOk || loading}
                    />
                    {!consentsOk ? <ConsentHint>Отметьте обязательные пункты, чтобы продолжить</ConsentHint> : null}
                    {errorMessages.length > 0 && (
                        <div className={styles.formErrorsBottom} role="alert">
                            <p className={styles.formErrorsBottomTitle}>Проверьте форму:</p>
                            <ul className={styles.formErrorsBottomList}>
                                {errorMessages.map((message, index) => (
                                    <li key={`${index}-${message}`}>{message}</li>
                                ))}
                            </ul>
                        </div>
                    )}
                </div>
            </div>
            <div className={styles.orderInformation}>
                <div className={styles.orderInformationHead}>
                    <p>Туры раскупают — цены меняются</p>
                </div>
                <div className={styles.orderInformationBody}>
                    <Icon name={'travel'} size={61} />
                    <p>Каждую секунду цены могут меняться</p>
                </div>
            </div>
        </div>
    );
};

export default BookingOrderCard;
