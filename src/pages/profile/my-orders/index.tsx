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


    useEffect(() => {
        if(user){
            getOrdersUsers(user?.id).then(res=>{
                console.log('getOrdersUsers',res)
                setOrders(res || [])
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
                            {orders.map((item: any) => (
                                <OrderItem item={item}/>
                            ))}
                        </div>
                    </div>

                </div>
            </div>
        </main>
    );
}
export default MyOrders
