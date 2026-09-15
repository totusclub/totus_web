import React, { useMemo } from 'react';
import { useRouter } from 'next/router';
import styles from './orderDetails.module.css';
import Icon from '@/components/icons/Icon';
import OrderSbpPayButton from '@/components/profile/OrderSbpPayButton';
import OrderChangeRequest from '@/components/profile/OrderChangeRequest/OrderChangeRequest';
import { isOrderAwaitingPayment } from '@/utils/orderPayment';
import { getStatusColor, getStatusLabel } from '@/utils/orderDisplay';
import { getTotusBooking, getTotusBookingStatusColor } from '@/utils/totusBooking';
import TotusBookingSummary from '@/components/totusBooking/TotusBookingSummary';
import useAuth from '@/hooks/useAuth';
import { decodeToken } from '@/utils/auth';

interface OrderDetailsHeaderProps {
  order: any;
  pkg: any;
  hotelName?: string;
  destination?: string;
}

const resolveDocumentsEmail = (
  order: any,
  pkg: any,
  user: { email?: string } | null | undefined,
  token: string | null | undefined,
): string => {
  const fromUser = user?.email?.trim();
  if (fromUser) return fromUser;

  if (token) {
    const decoded = decodeToken(token) as { email?: string } | null;
    const fromToken = decoded?.email?.trim();
    if (fromToken) return fromToken;
  }

  const fromOrder =
    order?.package?.client?.email ??
    order?.client?.email ??
    pkg?.client?.email;

  return typeof fromOrder === 'string' && fromOrder.trim() ? fromOrder.trim() : '—';
};

const OrderDetailsHeader: React.FC<OrderDetailsHeaderProps> = ({
  order,
  pkg,
  hotelName = '',
  destination = '',
}) => {
  const router = useRouter();
  const { user, token } = useAuth();
  const orderId = order?.order_id ?? order?.id ?? '—';

  // Внутреннее бронирование (наш номер, оператор Arlekino) — статус и блок из totus_booking
  const totusBooking = useMemo(() => getTotusBooking(order), [order]);

  const statusColor = useMemo(
    () =>
      totusBooking
        ? getTotusBookingStatusColor(totusBooking.status)
        : getStatusColor(order?.package ?? pkg, order),
    [order, pkg, totusBooking],
  );

  const statusLabel = useMemo(
    () => (totusBooking ? totusBooking.statusLabel : getStatusLabel(order, pkg)),
    [order, pkg, totusBooking],
  );

  const price = useMemo(() => {
    const amount = order?.package?.price ?? order?.package?.full_price ?? pkg?.price ?? 0;
    return Number(amount).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  }, [pkg, order]);

  const clientEmail = useMemo(
    () => resolveDocumentsEmail(order, pkg, user, token),
    [order, pkg, user, token],
  );

  return (
    <div className={styles.orderDetailsCard}>
      <div className={styles.orderDetailsHeader}>
        <div className={styles.orderDetailsHeaderLeft}>
          <div className={styles.backButton} onClick={() => router.back()}>
            <Icon name="back" size={24} color="var(--textPrimary)" />
          </div>

          <div className={styles.orderDetailsTitleContainer}>
            <h1 className={styles.orderDetailsTitle}>{totusBooking ? 'Заказ' : 'Тур'} </h1>
            <p className={styles.orderDetailsTitleId}>№ {orderId}</p>
          </div>
        </div>
        <span
          className={styles.orderDetailsStatus}
          style={{ backgroundColor: statusColor }}
        >
          {statusLabel}
        </span>
      </div>

      {totusBooking ? (
        <div className={styles.orderDetailsPanel}>
          <TotusBookingSummary
            booking={totusBooking}
            fallbackAmount={Number(String(price).replace(/\D/g, '')) || null}
          />
        </div>
      ) : (
      <div className={styles.orderDetailsPanel}>
        <div className={styles.orderDetailsSection}>
          <p className={styles.orderDetailsSectionTitle}>Получение заказа</p>
          <p className={styles.orderDetailsSectionSubtitle}>
            Отправим документы на {clientEmail}
          </p>
        </div>

        <div className={styles.orderDetailsDivider}></div>

        <div className={styles.orderDetailsSection}>
          <p className={styles.orderDetailsSectionTitle}>
            {isOrderAwaitingPayment(order) ? 'К оплате' : 'Оплачено'}
          </p>
          <p className={styles.orderDetailsSectionSubtitle}>
            {hotelName ? `Тур в ${hotelName}` : 'Данные уточняются'}
            {destination ? `, ${destination}` : ''}
          </p>
          <p className={styles.orderDetailsSectionSubtitle}>{price} ₽</p>
        </div>

        <div className={styles.orderDetailsDivider}></div>

        <div className={styles.orderDetailsSectionLast}>
          <p className={styles.orderDetailsAmount}>Итого {price} ₽</p>
        </div>
      </div>
      )}

      {isOrderAwaitingPayment(order) && (
        <div className={styles.orderDetailsPayWrap}>
          <OrderSbpPayButton order={order} />
        </div>
      )}

      <OrderChangeRequest orderId={order?.order_id ?? order?.id} />
    </div>
  );
};

export default OrderDetailsHeader;
