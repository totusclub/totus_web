import React, { useMemo } from 'react';
import { useRouter } from 'next/router';
import styles from './orderDetails.module.css';
import Icon from '@/components/icons/Icon';

interface OrderDetailsHeaderProps {
  order: any;
  pkg: any;
  hotelName?: string;
  destination?: string;
}

const OrderDetailsHeader: React.FC<OrderDetailsHeaderProps> = ({ order, pkg, hotelName = '', destination = '' }) => {
  const router = useRouter();
  const orderId = order?.order_id ?? order?.id ?? '—';

  const statusInfo = useMemo(() => {
    const status = pkg?.status_for_client ??
      pkg?.state ??
      order?.package?.state ??
      order?.state ??
      'pending';

    const statusMap: Record<string, { text: string; color: string }> = {
      pending: { text: 'В обработке', color: 'var(--primary_blue)' },
      approved: { text: 'Подтверждено', color: 'var(--primary_green)' },
      confirm: { text: 'Подтверждено', color: 'var(--primary_green)' },
      cancel: { text: 'Отменено', color: 'var(--bgTertiary)' },
      cancelled: { text: 'Отменено', color: 'var(--bgTertiary)' },
    };

    return statusMap[status] || { text: 'В обработке', color: 'var(--primary_blue)' };
  }, [pkg, order]);

  const price = useMemo(() => {
    const amount = pkg?.price ?? pkg?.full_price ?? order?.package?.price ?? 0;
    return amount.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '\u202F');
  }, [pkg, order]);

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
          style={{ backgroundColor: statusInfo.color }}
        >
          {statusInfo.text}
        </span>
      </div>

      <div className={styles.orderDetailsPanel}>
        <div className={styles.orderDetailsSection}>
          <p className={styles.orderDetailsSectionTitle}>Получение заказа</p>
          <p className={styles.orderDetailsSectionSubtitle}>
            Отправим документы на {order?.package?.client?.email || order?.client?.email || pkg?.client?.email || '—'}
          </p>
        </div>

        <div className={styles.orderDetailsDivider}></div>

        <div className={styles.orderDetailsSection}>
          <p className={styles.orderDetailsSectionTitle}>Оплачено</p>
          <p className={styles.orderDetailsSectionSubtitle}>
            {hotelName ? `Тур в ${hotelName}` : 'Данные уточняются'}
            {destination ? `, ${destination}` : ''}
          </p>
          <p className={styles.orderDetailsSectionSubtitle}>{price} ₽</p>
        </div>

        <div className={styles.orderDetailsDivider}></div>

        <div className={styles.orderDetailsSectionLast}>
          {/* <p className={styles.orderDetailsSectionTitle}>Итого</p> */}
          <p className={styles.orderDetailsAmount}>Итого {price} ₽</p>
        </div>
      </div>
    </div>
  );
};

export default OrderDetailsHeader;

