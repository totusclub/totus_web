import styles from './profile.module.css';
import { useState, useEffect, useCallback, useRef } from 'react';
import OrderItem from '@/components/profile/orderItem';
import { getOrdersList } from '@/api/ordersList';
import { AUTH_LOGOUT_EVENT } from '@/api/http';
import { sortOrdersByNewest } from '@/utils/orderDisplay';
import useAuth from '@/hooks/useAuth';

type OrderListProps = {
  show?: boolean;
  variant?: 'desktop' | 'mobile';
};

/**
 * Последний загруженный список: в памяти (переходы между страницами профиля) и в sessionStorage
 * (перезагрузка вкладки). Страница сразу показывает его и обновляет в фоне. Только лёгкий список
 * (?view=list); при выходе стирается, другому аккаунту не показывается.
 */
const ORDERS_CACHE_KEY = 'totus:orders:list';
const ORDERS_CACHE_MAX_CHARS = 400000;
let memoryOrders: { userId: string; orders: any[] } | null = null;

function readCachedOrders(userId: string): any[] | null {
  if (memoryOrders && memoryOrders.userId === userId) return memoryOrders.orders;
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.sessionStorage.getItem(ORDERS_CACHE_KEY);
    if (!raw) return null;
    const saved = JSON.parse(raw);
    if (!saved || saved.userId !== userId || !Array.isArray(saved.orders)) return null;
    memoryOrders = { userId, orders: saved.orders };
    return saved.orders;
  } catch {
    return null;
  }
}

function writeCachedOrders(userId: string, orders: any[]) {
  memoryOrders = { userId, orders };
  if (typeof window === 'undefined') return;
  try {
    const raw = JSON.stringify({ userId, orders });
    if (raw.length <= ORDERS_CACHE_MAX_CHARS) window.sessionStorage.setItem(ORDERS_CACHE_KEY, raw);
  } catch {
    /* ignore: private mode / quota */
  }
}

function clearCachedOrders() {
  memoryOrders = null;
  if (typeof window === 'undefined') return;
  try {
    window.sessionStorage.removeItem(ORDERS_CACHE_KEY);
  } catch {
    /* ignore */
  }
}

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

const retryButtonStyle = {
  background: 'none',
  border: 0,
  padding: 0,
  font: 'inherit',
  color: 'inherit',
  textDecoration: 'underline',
  cursor: 'pointer',
} as const;

const OrderList = ({ show = true, variant = 'desktop' }: OrderListProps) => {
  const { user } = useAuth();
  // Только id: _app и useAuth несколько раз пересоздают объект user (setAuth), из-за этого
  // /user/orders запрашивался повторно.
  const userId = user?.id != null && user.id !== '' ? String(user.id) : null;
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const requestSeq = useRef(0);

  const load = useCallback(async (id: string) => {
    const seq = ++requestSeq.current;
    setFailed(false);

    // Сначала — то, что уже загружали (без скелетона), затем свежий список.
    const cached = readCachedOrders(id);
    if (cached) {
      setOrders(cached);
      setLoading(false);
    } else {
      setLoading(true);
    }

    try {
      const res = await getOrdersList(id);
      if (seq !== requestSeq.current) return;
      const next = sortOrdersByNewest(res || []);
      writeCachedOrders(id, next);
      setOrders(next);
    } catch {
      if (seq !== requestSeq.current) return;
      // Показанный список не стираем; без списка — ошибка, а не «Заказов пока нет».
      if (!cached) setFailed(true);
    } finally {
      if (seq === requestSeq.current) setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!userId) {
      // Keep skeleton while auth is restoring from token
      setLoading(true);
      return;
    }
    void load(userId);
    return () => {
      requestSeq.current += 1; // ответ для прежнего пользователя / после ухода со страницы не применяем
    };
  }, [userId, load]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    window.addEventListener(AUTH_LOGOUT_EVENT, clearCachedOrders);
    return () => window.removeEventListener(AUTH_LOGOUT_EVENT, clearCachedOrders);
  }, []);

  if (!show) return null;

  const listClass = variant === 'mobile' ? styles.orderListMob : styles.orderList;

  return (
    <div className={listClass}>
      <div className={styles.orderItemListBg}>
        <div className={styles.orderListHead}>
          {loading ? (
            <div className={styles.animationTextlazy} style={{ width: '160px', height: '20px' }} />
          ) : failed ? null : (
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
          ) : failed ? (
            <p className={styles.orderListEmpty}>
              Не удалось загрузить заказы.{' '}
              <button type="button" style={retryButtonStyle} onClick={() => userId && void load(userId)}>
                Повторить
              </button>
            </p>
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
