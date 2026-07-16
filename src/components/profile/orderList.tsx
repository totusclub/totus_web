import styles from './profile.module.css';
import { useState, useEffect } from 'react';
import OrderItem from '@/components/profile/orderItem';
import { getOrdersUsers } from '@/api/levelTravelApi';
import { sortOrdersByNewest } from '@/utils/orderDisplay';
import useAuth from '@/hooks/useAuth';

type OrderListProps = {
  show?: boolean;
  variant?: 'desktop' | 'mobile';
};

function OrderItemSkeleton() {
  return (
    <div className={styles.orderItemSkeleton}>
      <div className={styles.orderItemSkeletonHead}>
        <div className={styles.orderItemSkeletonHeadLeft}>
          <div className={styles.animationTextlazy} style={{ width: '60%', height: '24px' }} />
          <div className={styles.animationTextlazy} style={{ width: '40%', height: '16px' }} />
        </div>
        <div className={styles.orderItemSkeletonHeadRight}>
          <div className={styles.animationTextlazy} style={{ width: '120px', height: '20px' }} />
          <div className={styles.animationTextlazy} style={{ width: '100px', height: '14px' }} />
        </div>
      </div>
      <div className={styles.orderItemSkeletonInfo}>
        <div className={styles.animationTextlazy} style={{ width: '80%', height: '14px' }} />
        <div className={styles.animationTextlazy} style={{ width: '70%', height: '14px' }} />
        <div className={styles.animationTextlazy} style={{ width: '60%', height: '14px' }} />
        <div className={styles.animationTextlazy} style={{ width: '50%', height: '14px' }} />
      </div>
    </div>
  );
}

function OrderListSkeleton({ count = 4 }: { count?: number }) {
  return (
    <>
      {Array.from({ length: count }).map((_, index) => (
        <OrderItemSkeleton key={index} />
      ))}
    </>
  );
}

const OrderList = ({ show = true, variant = 'desktop' }: OrderListProps) => {
  const { user } = useAuth();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.id) {
      // Keep skeleton while auth is restoring from token
      setLoading(true);
      return;
    }

    let cancelled = false;
    setLoading(true);

    getOrdersUsers(user.id)
      .then((res) => {
        if (cancelled) return;
        setOrders(sortOrdersByNewest(res || []));
      })
      .catch(() => {
        if (cancelled) return;
        setOrders([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [user]);

  if (!show) return null;

  const listClass = variant === 'mobile' ? styles.orderListMob : styles.orderList;

  return (
    <div className={listClass}>
      <div className={styles.orderItemListBg}>
        <div className={styles.orderListHead}>
          {loading ? (
            <div className={styles.animationTextlazy} style={{ width: '160px', height: '20px' }} />
          ) : (
            <p>Найдено {orders.length} заказов</p>
          )}
        </div>
        <div className={styles.orderListWrap}>
          {loading ? (
            <OrderListSkeleton />
          ) : orders.length > 0 ? (
            orders.map((item: any) => (
              <OrderItem key={item?.order_id ?? item?.id} item={item} />
            ))
          ) : (
            <p className={styles.orderListEmpty}>Заказов пока нет</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default OrderList;
export { OrderListSkeleton, OrderItemSkeleton };
