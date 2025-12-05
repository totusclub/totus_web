import React, { useMemo } from 'react';
import styles from './orderDetails.module.css';
import OrderDetailsHeader from './OrderDetailsHeader';
import OrderDetailsSections from './OrderDetailsSections';

interface OrderDetailsContentProps {
  order: any;
}

const OrderDetailsContent: React.FC<OrderDetailsContentProps> = ({ order }) => {
  const pkg = useMemo(() => {
    if (!order) return null;
    if (order?.package?.package) {
      return order.package.package;
    }
    if (order?.package) {
      return order.package;
    }
    return order;
  }, [order]);

  const hotelName = pkg?.hotel?.name || '';
  const destination = [pkg?.hotel?.city, pkg?.hotel?.country].filter(Boolean).join(', ');

  return (
    <div className={styles.orderDetailsContainer}>
      <OrderDetailsHeader order={order} pkg={pkg} hotelName={hotelName} destination={destination} />

      <OrderDetailsSections
        pkg={pkg}
        hotelName={hotelName}
        destination={destination}
        order={order}
      />
    </div>
  );
};

export default OrderDetailsContent;

