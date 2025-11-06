import styles from './profile.module.css'
import Select from "@/components/UI/select";
import {useState,useEffect} from "react";
import OrderItem from "@/components/profile/orderItem";
import {getOrdersUsers} from "@/api/levelTravelApi";
import useAuth from "@/hooks/useAuth";

const options = [{value:'RUB',name:'Сначала новые'}];

const MOCK_DATA = [
    {
        id:'3452–234',
        date:'От 12 июня',
        status:'pending',
        price:'120 593 ₽',
        pay_type:'Банковская карта',
        location:'Санкт-Петербург, Плюс Питер Хостел',
        dates:'16 июня 2025 - 17 июня 2025, 1 ночь',
        flight:'Вылет: Внуково, 16 июня 2025',
        tourist:'TOSUNYAN EDVARD'
    },
    {
        id:'3452–234',
        date:'От 12 июня',
        status:'confirm',
        price:'120 593 ₽',
        pay_type:'Банковская карта',
        location:'Санкт-Петербург, Плюс Питер Хостел',
        dates:'16 июня 2025 - 17 июня 2025, 1 ночь',
        flight:'Вылет: Внуково, 16 июня 2025',
        tourist:'TOSUNYAN EDVARD'
    },
    {
        id:'3452–234',
        date:'От 12 июня',
        status:'cancel',
        price:'120 593 ₽',
        pay_type:'Банковская карта',
        location:'Санкт-Петербург, Плюс Питер Хостел',
        dates:'16 июня 2025 - 17 июня 2025, 1 ночь',
        flight:'Вылет: Внуково, 16 июня 2025',
        tourist:'TOSUNYAN EDVARD'
    },
    {
        id:'3452–234',
        date:'От 12 июня',
        status:'cancel',
        price:'120 593 ₽',
        pay_type:'Банковская карта',
        location:'Санкт-Петербург, Плюс Питер Хостел',
        dates:'16 июня 2025 - 17 июня 2025, 1 ночь',
        flight:'Вылет: Внуково, 16 июня 2025',
        tourist:'TOSUNYAN EDVARD'
    },
    {
        id:'3452–234',
        date:'От 12 июня',
        status:'cancel',
        price:'120 593 ₽',
        pay_type:'Банковская карта',
        location:'Санкт-Петербург, Плюс Питер Хостел',
        dates:'16 июня 2025 - 17 июня 2025, 1 ночь',
        flight:'Вылет: Внуково, 16 июня 2025',
        tourist:'TOSUNYAN EDVARD'
    },    {
        id:'3452–234',
        date:'От 12 июня',
        status:'cancel',
        price:'120 593 ₽',
        pay_type:'Банковская карта',
        location:'Санкт-Петербург, Плюс Питер Хостел',
        dates:'16 июня 2025 - 17 июня 2025, 1 ночь',
        flight:'Вылет: Внуково, 16 июня 2025',
        tourist:'TOSUNYAN EDVARD'
    },
]
const OrderList = (show:boolean) => {
    const [selected, setSelected] = useState<string>();
    const {user,token} = useAuth()
    const [orders,setOrders] = useState([]);


    useEffect(() => {
        if(user){
            getOrdersUsers(user?.id).then(res=>{
                // console.log('getOrdersUsers',res)
                setOrders(res || [])
            })
        }

    },[user])
    if(show){
        return (
            <div className={`${styles.orderList}`}>
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
        );
    }else{
        return null
    }

};

export default OrderList;
