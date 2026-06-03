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
                    setOrder(response);
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
                    <div className={styles.orderDetailsSkeleton}>
                        {/* Header skeleton */}
                        <div className={styles.orderDetailsSkeletonCard}>
                            <div className={styles.orderDetailsSkeletonHeader}>
                                <div className={styles.orderDetailsSkeletonHeaderLeft}>
                                    <div className={styles.animationTextlazy} style={{ width: '24px', height: '24px', borderRadius: '50%' }}></div>
                                    <div className={styles.animationTextlazy} style={{ width: '200px', height: '24px' }}></div>
                                </div>
                                <div className={styles.animationTextlazy} style={{ width: '120px', height: '24px', borderRadius: '15px' }}></div>
                            </div>
                            <div className={styles.orderDetailsSkeletonPanel}>
                                <div className={styles.orderDetailsSkeletonSection}>
                                    <div className={styles.animationTextlazy} style={{ width: '60%', height: '16px' }}></div>
                                    <div className={styles.animationTextlazy} style={{ width: '80%', height: '14px' }}></div>
                                </div>
                                <div className={styles.animationTextlazy} style={{ width: '100%', height: '1px', background: 'var(--borderTertiary)' }}></div>
                                <div className={styles.orderDetailsSkeletonSection}>
                                    <div className={styles.animationTextlazy} style={{ width: '50%', height: '16px' }}></div>
                                    <div className={styles.animationTextlazy} style={{ width: '70%', height: '14px' }}></div>
                                    <div className={styles.animationTextlazy} style={{ width: '40%', height: '14px' }}></div>
                                </div>
                                <div className={styles.animationTextlazy} style={{ width: '100%', height: '1px', background: 'var(--borderTertiary)' }}></div>
                                <div className={styles.orderDetailsSkeletonSection}>
                                    <div className={styles.animationTextlazy} style={{ width: '30%', height: '16px' }}></div>
                                </div>
                            </div>
                        </div>
                        {/* Sections skeleton */}
                        <div className={styles.orderDetailsSkeletonCard}>
                            <div className={styles.orderDetailsSkeletonPanel}>
                                <div className={styles.orderDetailsSkeletonSection}>
                                    <div className={styles.animationTextlazy} style={{ width: '40%', height: '16px' }}></div>
                                    <div className={styles.animationTextlazy} style={{ width: '60%', height: '14px' }}></div>
                                </div>
                            </div>
                            <div className={styles.orderDetailsSkeletonSection} style={{ marginTop: '16px' }}>
                                <div className={styles.animationTextlazy} style={{ width: '50%', height: '14px', marginBottom: '16px' }}></div>
                                <div className={styles.orderDetailsSkeletonPanel}>
                                    <div className={styles.animationTextlazy} style={{ width: '80%', height: '16px' }}></div>
                                    <div className={styles.animationTextlazy} style={{ width: '100%', height: '1px', background: 'var(--borderTertiary)', margin: '12px 0' }}></div>
                                    <div className={styles.animationTextlazy} style={{ width: '70%', height: '16px' }}></div>
                                    <div className={styles.animationTextlazy} style={{ width: '100%', height: '1px', background: 'var(--borderTertiary)', margin: '12px 0' }}></div>
                                    <div className={styles.animationTextlazy} style={{ width: '60%', height: '16px' }}></div>
                                </div>
                            </div>
                        </div>
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

