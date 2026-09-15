import styles from './profile.module.css'
import { useMemo } from "react";
import { useRouter } from "next/router";
import OrderSbpPayButton from "@/components/profile/OrderSbpPayButton";
import { getPaymentMethodLabel, isOrderAwaitingPayment } from "@/utils/orderPayment";
import {
    formatDepartureLine,
    formatOrderPrice,
    formatOrderStartLabel,
    formatTravelPeriod,
    getNestedPackage,
    getStatusColor,
    getStatusCssKey,
    getStatusLabel,
} from "@/utils/orderDisplay";
import {
    formatTotusRefundLine,
    getTotusBooking,
    getTotusBookingCssKey,
    getTotusBookingStatusColor,
} from "@/utils/totusBooking";
import totusStyles from "@/components/totusBooking/totusBooking.module.css";

const OrderItem = ({ item }: any) => {
    const router = useRouter();
    const nestedPkg = useMemo(() => getNestedPackage(item), [item]);
    // Внутреннее бронирование (наш номер, оператор Arlekino) — статус из totus_booking
    const totusBooking = useMemo(() => getTotusBooking(item), [item]);
    const statusClass = useMemo(
        () => (totusBooking ? getTotusBookingCssKey(totusBooking.status) : getStatusCssKey(item?.package, item)),
        [item, totusBooking],
    );
    const statusColor = useMemo(
        () => (totusBooking ? getTotusBookingStatusColor(totusBooking.status) : getStatusColor(item?.package, item)),
        [item, totusBooking],
    );
    const statusLabel = useMemo(
        () => (totusBooking ? totusBooking.statusLabel : getStatusLabel(item, item?.package)),
        [item, totusBooking],
    );
    const totusRefundLine = useMemo(() => formatTotusRefundLine(totusBooking), [totusBooking]);
    const orderDateLabel = useMemo(() => formatOrderStartLabel(item), [item]);
    const travelPeriod = useMemo(() => formatTravelPeriod(nestedPkg), [nestedPkg]);
    const departureLine = useMemo(() => formatDepartureLine(nestedPkg), [nestedPkg]);
    const tourists = item?.package?.tourists ?? [];

    const handleClick = () => {
        if (item?.order_id) {
            router.push(`/profile/my-orders/${item.order_id}`);
        }
    };

    const city = nestedPkg?.hotel?.city;
    const country = nestedPkg?.hotel?.country;

    return (
        <div
            className={`${styles.orderItem} ${styles[statusClass] || ''}`}
            onClick={handleClick}
            style={{ cursor: 'pointer' }}
        >
            <div className={styles.orderItemHead}>
                <div className={styles.orderItemHeadLeft}>
                    <div className={styles.orderItemTitleRow}>
                        <p className={styles.orderItemTitle}>
                            {totusBooking ? 'Заказ' : 'Тур'}{' '}
                            <span className={styles.orderItemId}>№ {item?.order_id}</span>
                        </p>
                        {statusLabel ? (
                            <span
                                style={{ backgroundColor: statusColor }}
                                className={styles.orderItemStatus}
                            >
                                {statusLabel}
                            </span>
                        ) : null}
                    </div>
                    {orderDateLabel ? (
                        <p className={styles.orderItemDate}>{orderDateLabel}</p>
                    ) : null}
                </div>
                <div className={styles.orderItemPrices}>
                    <p className={styles.orderItemPrice}>{formatOrderPrice(item)}</p>
                    <p>{getPaymentMethodLabel(item)}</p>
                </div>
            </div>
            <div className={styles.orderItemInfo}>
                {(city || country) ? (
                    <p>{[city, country].filter(Boolean).join(', ')}</p>
                ) : null}
                {travelPeriod !== '—' ? <p>{travelPeriod}</p> : null}
                {!totusBooking && departureLine ? <p>{departureLine}</p> : null}
                {totusBooking ? (
                    <p className={totusStyles.operatorLine}>
                        <span>Туроператор: </span>
                        {totusBooking.operator}
                    </p>
                ) : null}
                {totusBooking && totusBooking.status === 'confirmed' && totusBooking.hotelBookingRef ? (
                    <p className={totusStyles.operatorLine}>
                        <span>Номер брони: </span>
                        {totusBooking.hotelBookingRef}
                    </p>
                ) : null}
                {totusBooking && totusBooking.statusText ? (
                    <p className={totusStyles.operatorLine}>
                        <span>{totusBooking.statusText}</span>
                    </p>
                ) : null}
                {totusBooking && totusRefundLine && !totusBooking.statusText ? (
                    <p className={totusStyles.operatorLine}>
                        <span>{totusRefundLine}</span>
                    </p>
                ) : null}
                {tourists.length > 0 ? (
                    <p>
                        Туристы:{' '}
                        {tourists.map((t: any, index: number) => (
                            <span key={index}>
                                {t.name} {t.surname}
                                {index < tourists.length - 1 ? ', ' : ''}
                            </span>
                        ))}
                    </p>
                ) : null}
            </div>

            {isOrderAwaitingPayment(item) && <OrderSbpPayButton order={item} />}
        </div>
    );
};

export default OrderItem;
