import {useEffect,useState} from 'react'
import {checkPay} from "@/api/levelTravelApi";
import {useRouter} from "next/router";
import Button from "@/components/UI/button";


export default function Pay() {
    const router = useRouter();
    const [status, setStatus] = useState(null);

    useEffect(()=>{
        if(router?.query?.orderId){
            checkPay({orderId:router?.query?.orderId}).then((e)=>{
                console.log(e);
                setStatus(e?.status);
            })
        }
    },[router])

    return (

            <div className="content">
                <div style={{minHeight: '60vh',display: 'flex', justifyContent: 'center'}}>
                    {status === 'PAID' && (
                        <div style={{width:'380px'}}>
                            <p style={{textAlign: 'center', marginTop: '15vh',fontSize:32}}>Спасибо за ваш заказ</p>
                            <p style={{textAlign: 'center',marginTop:4,fontSize:18,marginBottom:30}}>Платёж успешно выполнен</p>
                            <Button title={'Перейти в профиль'} />
                        </div>
                    )}
                    {status !== 'PAID' && (
                        <div style={{width:'380px'}}>
                            <p style={{textAlign: 'center', marginTop: '15vh',fontSize:32}}>Оплата не завершена</p>
                            <p style={{textAlign: 'center',marginTop:4,fontSize:18,marginBottom:30}}>К сожалению, платёж не был завершён. Попробуйте снова или используйте другой способ</p>
                            <Button title={'Перейти на главную'} />
                        </div>
                    )}

                </div>

            </div>
    );
}
