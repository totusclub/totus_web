import React, { useMemo } from 'react';
import { useRouter } from 'next/router';
import styles from './orderDetails.module.css';
import Icon from '@/components/icons/Icon';
import OrderSbpPayButton from '@/components/profile/OrderSbpPayButton';
import { isOrderAwaitingPayment } from '@/utils/orderPayment';
import { getStatusColor, getStatusLabel } from '@/utils/orderDisplay';

interface OrderDetailsHeaderProps {
  order: any;
  pkg: any;
  hotelName?: string;
  destination?: string;
}

const OrderDetailsHeader: React.FC<OrderDetailsHeaderProps> = ({
  order,
  pkg,
  hotelName = '',
  destination = '',
}) => {
  const router = useRouter();
  const orderId = order?.order_id ?? order?.id ?? '—';

  const statusColor = useMemo(
    () => getStatusColor(order?.package ?? pkg, order),
    [order, pkg],
  );

  const statusLabel = useMemo(
    () => getStatusLabel(order, pkg),
    [order, pkg],
  );

  const price = useMemo(() => {
    const amount = order?.package?.price ?? order?.package?.full_price ?? pkg?.price ?? 0;
    return Number(amount).toString().replace(/\B(?=(\d{3})+(?!\d))/g, '\u202F');
  }, [pkg, order]);

  const clientEmail =
    order?.package?.client?.email ??
    order?.client?.email ??
    pkg?.client?.email ??
    '—';

  return (
    <div className={styles.orderDetailsCard}>
      <div className={styles.orderDetailsHeader}>
        <div className={styles.orderDetailsHeaderLeft}>
          <div className={styles.backButton} onClick={() => router.back()}>
            <Icon name="back" size={24} color="var(--textPrimary)" />
          </div>

          <div className={styles.orderDetailsTitleContainer}>
            <h1 className={styles.orderDetailsTitle}>Тур </h1>
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

      {isOrderAwaitingPayment(order) && (
        <div className={styles.orderDetailsPayWrap}>
          <OrderSbpPayButton order={order} />
        </div>
      )}
    </div>
  );
};

export default OrderDetailsHeader;
