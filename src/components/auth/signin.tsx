import React, {useState} from 'react';
import styles from './auth.module.css'
import Input from "@/components/UI/input";
import Button from "@/components/UI/button";
import {SignInRequest} from "@/api/AuthApi";
import YandexSmartCaptcha, {
    YANDEX_SMARTCAPTCHA_SITEKEY,
} from '@/components/auth/YandexSmartCaptcha';
import YandexIdButton from '@/components/auth/YandexIdButton';

const SignInForm: React.FC = ({setScreen,setEmail}:any) => {
    const [login, setLogin] = useState("");
    const [captchaToken, setCaptchaToken] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const [emailValid, setEmailValid] = useState(false);

    const captchaRequired = Boolean(YANDEX_SMARTCAPTCHA_SITEKEY);
    const disabled =
        !emailValid || loading || (captchaRequired && !captchaToken);

    const handelLogin = async ()=>{
        if (disabled) return;
        setError('');
        setLoading(true);
        try {
            const res = await SignInRequest({
                email: login,
                'smart-token': captchaToken,
                smartToken: captchaToken,
            });
            if (res?.error || res?.message === 'Captcha validation failed') {
                setError(res?.message || 'Ошибка капчи');
                setCaptchaToken('');
                return;
            }
            setEmail(login)
            setScreen(res.screen)
        } catch (err: any) {
            setError(
                err?.response?.data?.message ||
                    err?.message ||
                    'Не удалось войти',
            );
            setCaptchaToken('');
        } finally {
            setLoading(false);
        }
    }

    const handleEmail = (value:any) => {
        setLogin(value);
        const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
        setEmailValid(isEmail);
    };


    return (
     <div className={styles.authCard}>
         <Input value={login} onChange={(e)=>handleEmail(e)} placeholder={'Электронная почта'} />
         <div className={styles.authCardText}>
             <p>Мы позвоним или отправим сообщение, чтобы подтвердить ваш номер. Применяются стандартные тарифы на сообщения и данные.</p>
         </div>
         <YandexSmartCaptcha onTokenChange={setCaptchaToken} />
         {error ? <p className={styles.captchaError}>{error}</p> : null}
         <Button disabled={disabled} onClick={()=>handelLogin()} title={'Войти'}/>
         <YandexIdButton />
     </div>
    );
};

export default SignInForm;
