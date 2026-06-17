import React, { useMemo } from 'react';
import styles from './orderDetails.module.css';
import OrderDetailsHeader from './OrderDetailsHeader';
import OrderDetailsSections from './OrderDetailsSections';
import { getNestedPackage } from '@/utils/orderDisplay';

interface OrderDetailsContentProps {
  order: any;
  apiDocuments?: Array<{
    title?: string;
    public_url?: string;
    source_url?: string;
    url?: string;
  }>;
}

const OrderDetailsContent: React.FC<OrderDetailsContentProps> = ({
  order,
  apiDocuments = [],
}) => {
  const pkg = useMemo(() => getNestedPackage(order), [order]);

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
        apiDocuments={apiDocuments}
      />
    </div>
  );
};

export default OrderDetailsContent;
