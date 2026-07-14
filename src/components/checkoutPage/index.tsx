import styles from './checkout.module.css';
import CheckoutCard from "@/components/checkoutPage/checkOutCard";
import CheckoutItems from "@/components/checkoutPage/checkOutItems";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/router";
import { getOrder } from "@/api/levelTravelApi";

function readStoredBuyerContacts(orderId: string | string[] | undefined) {
    if (!orderId || typeof window === 'undefined') return { email: '', phone: '' };
    const id = Array.isArray(orderId) ? orderId[0] : orderId;
    try {
        const raw = sessionStorage.getItem(`checkout_buyer_${id}`);
        if (!raw) return { email: '', phone: '' };
        const parsed = JSON.parse(raw);
        return {
            email: String(parsed?.email || '').trim(),
            phone: String(parsed?.phone || '').trim(),
        };
    } catch {
        return { email: '', phone: '' };
    }
}

const CheckoutScreen = () => {
    const router = useRouter();
    const [order, setOrder] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Contacts typed on booking screen (authoritative for display)
    const buyerFromBooking = useMemo(() => {
        const fromQuery = {
            email: String(
                (Array.isArray(router.query.email) ? router.query.email[0] : router.query.email) || '',
            ).trim(),
            phone: String(
                (Array.isArray(router.query.phone) ? router.query.phone[0] : router.query.phone) || '',
            ).trim(),
        };
        const fromStorage = readStoredBuyerContacts(router.query.order_id);
        return {
            email: fromQuery.email || fromStorage.email,
            phone: fromQuery.phone || fromStorage.phone,
        };
    }, [router.query.order_id, router.query.email, router.query.phone]);

    useEffect(() => {
        const orderId = router.query.order_id;
        if (!orderId) return;

        setLoading(true);
        setError(null);

        getOrder(orderId as never)
            .then((e) => {
                if (e?.error && !e?.package) {
                    setError(typeof e.error === 'string' ? e.error : 'Не удалось загрузить заказ');
                    setOrder(null);
                    return;
                }
                setOrder(e?.package || null);
            })
            .catch(() => {
                setError('Не удалось загрузить заказ');
                setOrder(null);
            })
            .finally(() => setLoading(false));
    }, [router.query.order_id]);

    return (
        <div className={'content'}>
            <div className={`${styles.bookingScreen} ${styles.column}`}>
                {error ? <p>{error}</p> : null}
                <CheckoutItems
                    order={order}
                    dataLoading={loading}
                    buyerFromBooking={buyerFromBooking}
                />
                <CheckoutCard order={order} />
            </div>
        </div>
    );
};

export default CheckoutScreen;
