import {useEffect,useState} from 'react'
import {checkPay} from "@/api/levelTravelApi";
import {useRouter} from "next/router";
import Button from "@/components/UI/button";
import { isSbpPaymentPaid } from '@/utils/sbpPayment';


export default function Pay() {
    const router = useRouter();
    const [status, setStatus] = useState(null);

    useEffect(()=>{
        const orderIdRaw = router?.query?.orderId;
        const orderId = Array.isArray(orderIdRaw) ? orderIdRaw[0] : orderIdRaw;
        if (!orderId) return;

        const qrcId =
            typeof window !== "undefined"
                ? sessionStorage.getItem(`sbp_qrc_${orderId}`)
                : null;

        checkPay({ orderId, ...(qrcId ? { qrcId } : {}) }).then((e) => {
            setStatus(isSbpPaymentPaid(e) ? "RECONCILED" : e?.status);
        });
    },[router])

    const SendModalMessage = ()=>{
        if (window.ReactNativeWebView && window.ReactNativeWebView.postMessage) {
            window.ReactNativeWebView.postMessage({status:status});
        }
    }

    return (

            <div className="content">
                <div style={{minHeight: '60vh',display: 'flex', justifyContent: 'center'}}>
                    {status === 'RECONCILED' && (
                        <div style={{width:'380px'}}>
                            <p style={{textAlign: 'center', marginTop: '15vh',fontSize:32}}>Спасибо за ваш заказ</p>
                            <p style={{textAlign: 'center',marginTop:4,fontSize:18,marginBottom:30}}>Платёж успешно выполнен</p>
                            <Button title={'Перейти в профиль'} onClick={()=>SendModalMessage()} />
                        </div>
                    )}
                    {status !== 'RECONCILED' && (
                        <div style={{width:'380px'}}>
                            <p style={{textAlign: 'center', marginTop: '15vh',fontSize:32}}>Оплата не завершена</p>
                            <p style={{textAlign: 'center',marginTop:4,fontSize:18,marginBottom:30}}>К сожалению, платёж не был завершён. Попробуйте снова или используйте другой способ</p>
                            <Button title={'Перейти на главную'} onClick={()=>SendModalMessage()} />
                        </div>
                    )}

                </div>

            </div>
    );
}
