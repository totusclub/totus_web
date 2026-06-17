import OrderList from "@/components/profile/orderList";
import withAuth from "@/utils/withAuth";
import styles from "@/components/profile/profile.module.css";
import OrderItem from "@/components/profile/orderItem";
import {useEffect, useState} from "react";
import useAuth from "@/hooks/useAuth";
import {getOrdersUsers} from "@/api/levelTravelApi";


const MyOrders = ()=> {
    const [selected, setSelected] = useState<string>();
    const {user,token} = useAuth()
    const [orders,setOrders] = useState([]);
    const [loading, setLoading] = useState<boolean>(true);


    useEffect(() => {
        if(user){
            setLoading(true);
            getOrdersUsers(user?.id).then(res=>{
                setOrders(res || [])
                setLoading(false);
            }).catch(() => {
                setLoading(false);
            })
        }

    },[user])
    return (
        <main className={'searchContainer'}>
            <div className={'content row'}>
                {/*<OrderList show={true}/>*/}
                <div className={styles.orderListMob}>
                    <div className={styles.orderItemListBg}>
                        <div className={styles.orderListHead}>
                            <p>Найдено {orders.length} заказов</p>
                            {/*<Select*/}
                            {/*    options={options}*/}
                            {/*    value={selected}*/}
                            {/*    onChange={setSelected}*/}
                            {/*    label={'Сортировка'}*/}
                            {/*    placeholder="Сначала новые"/>*/}
                        </div>
                        <div className={styles.orderListWrap}>
                            {loading ? (
                                // Skeleton loading
                                Array.from({ length: 3 }).map((_, index) => (
                                    <div key={index} className={styles.orderItemSkeleton}>
                                        <div className={styles.orderItemSkeletonHead}>
                                            <div className={styles.orderItemSkeletonHeadLeft}>
                                                <div className={styles.animationTextlazy} style={{ width: '60%', height: '24px' }}></div>
                                                <div className={styles.animationTextlazy} style={{ width: '40%', height: '16px' }}></div>
                                            </div>
                                            <div className={styles.orderItemSkeletonHeadRight}>
                                                <div className={styles.animationTextlazy} style={{ width: '120px', height: '20px' }}></div>
                                                <div className={styles.animationTextlazy} style={{ width: '100px', height: '14px' }}></div>
                                            </div>
                                        </div>
                                        <div className={styles.orderItemSkeletonInfo}>
                                            <div className={styles.animationTextlazy} style={{ width: '80%', height: '14px' }}></div>
                                            <div className={styles.animationTextlazy} style={{ width: '70%', height: '14px' }}></div>
                                            <div className={styles.animationTextlazy} style={{ width: '60%', height: '14px' }}></div>
                                            <div className={styles.animationTextlazy} style={{ width: '50%', height: '14px' }}></div>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                orders.map((item: any, index: number) => (
                                    <OrderItem key={index} item={item}/>
                                ))
                            )}
                        </div>
                    </div>

                </div>
            </div>
        </main>
    );
}
export default withAuth(MyOrders);
