import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { getOrder, getOrderDocuments } from '@/api/levelTravelApi';
import OrderDetailsContent from '@/components/profile/orderDetails/OrderDetailsContent';
import styles from '@/components/profile/profile.module.css';
import withAuth from '@/utils/withAuth';

const OrderDetails = () => {
    const router = useRouter();
    const { order_id } = router.query;
    const [order, setOrder] = useState<any>(null);
    const [apiDocuments, setApiDocuments] = useState<any[]>([]);
    const [loading, setLoading] = useState<boolean>(true);

    useEffect(() => {
        if (!order_id) return;

        setLoading(true);

        Promise.all([
            getOrder(order_id as string),
            getOrderDocuments(order_id as string).catch(() => ({ documents: [] })),
        ])
            .then(([orderResponse, documentsResponse]) => {
                setOrder(orderResponse);
                setApiDocuments(documentsResponse?.documents ?? []);
            })
            .catch((err) => {
                console.error('Failed to fetch order:', err);
                setOrder(null);
                setApiDocuments([]);
            })
            .finally(() => {
                setLoading(false);
            });
    }, [order_id]);

    if (loading) {
        return (
            <main className={'searchContainer'}>
                <div className={'content'}>
                    <div className={styles.orderDetailsSkeleton}>
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
                <OrderDetailsContent order={order} apiDocuments={apiDocuments} />
            </div>
        </main>
    );
};

export default withAuth(OrderDetails);
