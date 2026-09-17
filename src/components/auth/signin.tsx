import React, {useEffect, useState} from 'react';
import styles from './auth.module.css'
import Input from "@/components/UI/input";
import Button from "@/components/UI/button";
import {SignInRequest} from "@/api/AuthApi";
import YandexSmartCaptcha, {
    YANDEX_SMARTCAPTCHA_SITEKEY,
} from '@/components/auth/YandexSmartCaptcha';
import YandexIdButton from '@/components/auth/YandexIdButton';

/**
 * Вход по email. Капча показывается ПОСЛЕ нажатия «Войти» и, как только
 * пройдена, сама отправляет форму — дальше экран подтверждения кода.
 * Вход через Яндекс ID капчу не требует: робот не пройдёт подтверждение у Яндекса.
 */
const SignInForm: React.FC = ({setScreen,setEmail}:any) => {
    const [login, setLogin] = useState("");
    const [captchaToken, setCaptchaToken] = useState("");
    const [captchaVisible, setCaptchaVisible] = useState(false);
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const [emailValid, setEmailValid] = useState(false);

    const captchaRequired = Boolean(YANDEX_SMARTCAPTCHA_SITEKEY);
    const disabled = !emailValid || loading;

    const submit = async (token: string) => {
        setError('');
        setLoading(true);
        try {
            const res = await SignInRequest({
                email: login,
                'smart-token': token,
                smartToken: token,
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
    };

    const handelLogin = async ()=>{
        if (disabled) return;
        // Капча нужна — показываем её и ждём прохождения, запрос уйдёт сам.
        if (captchaRequired && !captchaToken) {
            setCaptchaVisible(true);
            setError('');
            return;
        }
        await submit(captchaToken);
    }

    // Капча пройдена после нажатия «Войти» — отправляем без второго клика.
    useEffect(() => {
        if (!captchaVisible || !captchaToken || loading || !emailValid) return;
        void submit(captchaToken);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [captchaToken, captchaVisible]);

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
         {captchaVisible ? (
             <>
                 <p className={styles.captchaHint}>Подтвердите, что вы не робот — и мы отправим код на почту</p>
                 <YandexSmartCaptcha onTokenChange={setCaptchaToken} />
             </>
         ) : null}
         {error ? <p className={styles.captchaError}>{error}</p> : null}
         <Button disabled={disabled} loading={loading} onClick={()=>handelLogin()} title={'Войти'}/>
         <YandexIdButton />
     </div>
    );
};

export default SignInForm;
