import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { getOrder } from '@/api/levelTravelApi';
import OrderDetailsContent from '@/components/profile/orderDetails/OrderDetailsContent';
import styles from '@/components/profile/profile.module.css';
import withAuth from '@/utils/withAuth';

const OrderDetails = () => {
    const router = useRouter();
    const { order_id } = router.query;
    const [order, setOrder] = useState<any>(null);
    const [loading, setLoading] = useState<boolean>(true);

    useEffect(() => {
        if (order_id) {
            setLoading(true);
            getOrder(order_id as string)
                .then((response) => {
                    setOrder(response?.package || response);
                    setLoading(false);
                })
                .catch((err) => {
                    console.error('Failed to fetch order:', err);
                    setLoading(false);
                });
        }
    }, [order_id]);

    if (loading) {
        return (
            <main className={'searchContainer'}>
                <div className={'content'}>
                    <div className={styles.orderDetailsLoading}>
                        <p>Загрузка...</p>
                    </div>
                </div>
            </main>
        );
    }

    if (!order) {
        return (
            <main className={'searchContainer'}>
                <div className={'content'}>
                    <div className={styles.orderDetailsError}>
                        <p>Заказ не найден</p>
                    </div>
                </div>
            </main>
        );
    }

    return (
        <main className={'searchContainer'}>
            <div className={'content'}>
                <OrderDetailsContent order={order} />
            </div>
        </main>
    );
};

export default withAuth(OrderDetails);

