import {useEffect, useState} from 'react';
import VerificationCodeInput from "@/components/UI/verificationCodeInput";
import styles from './auth.module.css'
import {verifyCodeRequest} from "@/api/AuthApi";
import {decodeToken, saveToken} from "@/utils/auth";
import {useDispatch} from "react-redux";
import {setAuth} from "@/store/slices/authSlice";

export default function Verification({email,setOpen}:any) {
    const [secondsLeft, setSecondsLeft] = useState(60);
    const dispatch = useDispatch();
    const [valid, setValid] = useState<boolean>(false);

    const handleComplete = async (fullCode) => {
      const data =  await verifyCodeRequest({code:fullCode,email:email})
      if(data.auth){
          const user = decodeToken(data.authToken);
          saveToken(data.authToken)
          dispatch(setAuth({
              token: data.authToken,
              user,
          }));
          setOpen(false)
      }else{
          console.log('data',data)
          setValid(true)
      }
    };

    useEffect(() => {
        if (secondsLeft === 0) return;

        const interval = setInterval(() => {
            setSecondsLeft((prev) => prev - 1);
        }, 1000);

        return () => clearInterval(interval);
    }, [secondsLeft]);

    return (
        <div className={styles.containerVerify}>
            <VerificationCodeInput valid={valid} onComplete={handleComplete}  />
            <p>
                {secondsLeft > 0
                    ? `Выслать код повторно через ${secondsLeft} сек.`
                    : `Можно отправить код повторно`}
            </p>
        </div>
    );
}
