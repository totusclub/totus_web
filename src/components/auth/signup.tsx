import React, { useState, useEffect } from 'react';
import styles from './auth.module.css'
import Input from "@/components/UI/input";
import Button from "@/components/UI/button";
import { SignUpRequest } from "@/api/AuthApi";
import YandexSmartCaptcha, {
    YANDEX_SMARTCAPTCHA_SITEKEY,
} from '@/components/auth/YandexSmartCaptcha';


const SignUpForm: React.FC = ({ setScreen, setEmail, email }: any) => {
    const [params, setParams] = useState({
        email: email,
        name: '',
        l_name: '',
        phone: ''
    });
    const [captchaToken, setCaptchaToken] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const captchaRequired = Boolean(YANDEX_SMARTCAPTCHA_SITEKEY);
    const formReady =
        Boolean(params.name?.trim()) &&
        Boolean(params.l_name?.trim()) &&
        Boolean(params.email?.trim()) &&
        Boolean(params.phone?.trim());
    const disabled =
        !formReady || loading || (captchaRequired && !captchaToken);

    const handelSignup = async () => {
        if (disabled) return;
        setError('');
        setLoading(true);
        try {
            const res = await SignUpRequest({
                ...params,
                'smart-token': captchaToken,
                smartToken: captchaToken,
            });
            if (res?.error || (res?.message && !res?.screen)) {
                // signup success always has screen VERIFICATION
            }
            if (!res?.screen) {
                setError(res?.message || 'Ошибка регистрации');
                setCaptchaToken('');
                return;
            }
            setEmail(params.email)
            setScreen(res.screen)
        } catch (err: any) {
            setError(
                err?.response?.data?.message ||
                    err?.message ||
                    'Не удалось зарегистрироваться',
            );
            setCaptchaToken('');
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        setParams((prev) => ({ ...prev, email: email }))
    }, [email])

    const handleChange = (key: string, value: string) => {
        setParams({ ...params, [key]: value })
    }




    return (
        <div className={styles.authCard}>
            <Input value={params.name} onChange={(e) => handleChange('name', e)} placeholder={'Имя'} />
            <Input value={params.l_name} onChange={(e) => handleChange('l_name', e)} placeholder={'Фамилия'} />
            <Input value={params.email} onChange={(e) => handleChange('email', e)} placeholder={'Электронная почта'} />
            <Input value={params.phone} onChange={(e) => handleChange('phone', e)} placeholder={'Номер телефона'} />
            <div className={styles.authCardText}>
                <p>Мы позвоним или отправим сообщение, чтобы подтвердить ваш номер. Применяются стандартные тарифы на сообщения и данные.</p>
            </div>
            <YandexSmartCaptcha onTokenChange={setCaptchaToken} />
            {error ? <p className={styles.captchaError}>{error}</p> : null}
            <Button disabled={disabled} onClick={() => handelSignup()} title={'Зарегистрироваться'} />
        </div>
    );
};

export default SignUpForm;
