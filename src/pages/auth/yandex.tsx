/**
 * Страница возврата после входа через Яндекс ID.
 *
 * Сервер приводит сюда с одноразовым ticket (или с error). Сами токены в URL
 * не попадают: страница меняет ticket через POST /api/auth/yandex/exchange,
 * кладёт токены в localStorage (как после кода из письма) и возвращает туда,
 * откуда начинали. Макеты — claude/YANDEX_AUTH_DESIGN_RU.md.
 *
 * Если Яндекс не отдал почту — это не тупик: есть «Разрешить доступ к почте»
 * (повтор с force_confirm — Яндекс снова покажет экран прав) и «Войти по email»
 * (возврат на страницу с ?login=1 — шапка откроет модалку входа).
 */
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/router';
import { useDispatch } from 'react-redux';
import Head from 'next/head';
import styles from './yandex.module.css';
import Button from '@/components/UI/button';
import Input from '@/components/UI/input';
import { setAuth } from '@/store/slices/authSlice';
import { decodeToken, saveToken, saveRefreshToken } from '@/utils/auth';
import { getMe } from '@/api/AuthApi';
import { yandexExchange, updateProfilePhone, yandexStartUrl } from '@/api/YandexAuthApi';
import { formatRuPhoneInput, normalizeRuPhone, RU_PHONE_HINT } from '@/utils/phone';

type Stage = 'loading' | 'phone' | 'error';

const ERROR_TEXT: Record<string, { title: string; text: string }> = {
    yandex_email_required: {
        title: 'Яндекс не передал адрес почты',
        text: 'Почта нужна, чтобы связать вход с вашим аккаунтом Totus Club. Можно вернуться на страницу Яндекса и разрешить доступ — или войти по email, это займёт минуту.',
    },
    yandex_access_denied: {
        title: 'Вход отменён',
        text: 'Вы не разрешили доступ на странице Яндекса. Можно попробовать снова или войти по email.',
    },
    ticket_invalid: {
        title: 'Ссылка устарела',
        text: 'На подтверждение даётся две минуты. Начните вход заново.',
    },
};

const DEFAULT_ERROR = {
    title: 'Не получилось войти',
    text: 'Попробуйте ещё раз или войдите по email.',
};

function safePath(value: unknown): string {
    const raw = typeof value === 'string' ? value : '';
    if (!raw.startsWith('/') || raw.startsWith('//')) return '/';
    return raw;
}

/** Тот же путь, но с ?login=1 — шапка по нему открывает модалку входа по email. */
function withLoginQuery(path: string): string {
    const [pathname, query] = path.split('?');
    const params = new URLSearchParams(query || '');
    params.set('login', '1');
    return `${pathname || '/'}?${params.toString()}`;
}

const YandexAuthPage: React.FC = () => {
    const router = useRouter();
    const dispatch = useDispatch();
    const started = useRef(false);

    const [stage, setStage] = useState<Stage>('loading');
    const [errorCode, setErrorCode] = useState('');
    const [returnPath, setReturnPath] = useState('/');
    const [phone, setPhone] = useState('');
    const [saving, setSaving] = useState(false);
    const [phoneError, setPhoneError] = useState('');

    const finish = useCallback(
        (path: string) => {
            router.replace(path || '/');
        },
        [router],
    );

    useEffect(() => {
        if (!router.isReady || started.current) return;
        started.current = true;

        const path = safePath(router.query.return);
        setReturnPath(path);

        const queryError = typeof router.query.error === 'string' ? router.query.error : '';
        if (queryError) {
            setErrorCode(queryError);
            setStage('error');
            return;
        }

        const ticket = typeof router.query.ticket === 'string' ? router.query.ticket : '';
        if (!ticket) {
            setErrorCode('ticket_invalid');
            setStage('error');
            return;
        }

        yandexExchange(ticket)
            .then((data) => {
                const token = data.accessToken || data.authToken;
                if (!data?.auth || !token) {
                    setErrorCode('ticket_invalid');
                    setStage('error');
                    return;
                }
                const user = decodeToken(token);
                saveToken(token);
                if (data.refreshToken) saveRefreshToken(data.refreshToken);
                dispatch(setAuth({ token, user }));

                if (typeof window !== 'undefined' && (window as any).ReactNativeWebView?.postMessage) {
                    (window as any).ReactNativeWebView.postMessage(JSON.stringify({ screen: 'auth', user }));
                }

                getMe().then((profile) => {
                    if (profile) dispatch(setAuth({ token, user: { ...(user as any), ...profile } }));
                });

                if (data.needsPhone) {
                    setStage('phone');
                    return;
                }
                finish(path);
            })
            .catch((error: any) => {
                setErrorCode(error?.response?.data?.error || 'yandex_failed');
                setStage('error');
            });
    }, [router.isReady, router.query, dispatch, finish]);

    const onPhoneChange = (value: string | number) => {
        setPhone(formatRuPhoneInput(String(value)));
        if (phoneError) setPhoneError('');
    };

    const handleSavePhone = async () => {
        const normalized = normalizeRuPhone(phone);
        if (!normalized) {
            setPhoneError(RU_PHONE_HINT);
            return;
        }
        setPhoneError('');
        setSaving(true);
        try {
            const data = await updateProfilePhone(normalized);
            const token = data?.accessToken || data?.authToken;
            if (token) {
                saveToken(token);
                if (data.refreshToken) saveRefreshToken(data.refreshToken);
                dispatch(setAuth({ token, user: decodeToken(token) }));
            }
            finish(returnPath);
        } catch (error: any) {
            setPhoneError(
                error?.response?.data?.error === 'phone_invalid'
                    ? error?.response?.data?.message || RU_PHONE_HINT
                    : 'Не удалось сохранить номер',
            );
        } finally {
            setSaving(false);
        }
    };

    const goYandex = (force: boolean) => {
        window.location.href = yandexStartUrl(returnPath, { force });
    };
    const goEmailLogin = () => finish(withLoginQuery(returnPath));

    const needsEmailPermission = errorCode === 'yandex_email_required';
    const error = ERROR_TEXT[errorCode] || DEFAULT_ERROR;

    return (
        <>
            <Head>
                <title>Вход через Яндекс ID — Totus Club</title>
                <meta name="robots" content="noindex" />
            </Head>
            <div className={styles.wrap}>
                <div className={styles.card}>
                    {stage === 'loading' ? (
                        <>
                            <span className={styles.logo} aria-hidden="true">Я</span>
                            <h1 className={styles.title}>Завершаем вход…</h1>
                            <p className={styles.text}>
                                Проверяем ответ Яндекс ID и открываем ваш личный кабинет. Это занимает пару секунд.
                            </p>
                        </>
                    ) : null}

                    {stage === 'phone' ? (
                        <>
                            <h1 className={styles.title}>Почти готово</h1>
                            <p className={styles.text}>
                                Добавьте телефон — он нужен для оформления заказа и связи по бронированию.
                            </p>
                            <Input
                                value={phone}
                                onChange={onPhoneChange}
                                placeholder="+7 999 123-45-67"
                                type="tel"
                                inputMode="tel"
                                maxLength={18}
                                error={phoneError}
                            />
                            <p className={styles.hint}>Только российские номера: +7 или 8</p>
                            <Button title="Сохранить" full loading={saving} onClick={handleSavePhone} />
                            <button type="button" className={styles.link} onClick={() => finish(returnPath)}>
                                Пропустить
                            </button>
                        </>
                    ) : null}

                    {stage === 'error' ? (
                        <>
                            <h1 className={styles.title}>
                                {needsEmailPermission ? 'Нужен доступ к почте' : 'Не получилось войти'}
                            </h1>
                            <div className={styles.error}>
                                <p className={styles.errorTitle}>{error.title}</p>
                                <p className={styles.errorText}>{error.text}</p>
                            </div>
                            <button type="button" className={styles.yandexButton} onClick={() => goYandex(needsEmailPermission)}>
                                <span className={styles.logoSmall} aria-hidden="true">Я</span>
                                <span>{needsEmailPermission ? 'Разрешить доступ к почте' : 'Попробовать снова'}</span>
                            </button>
                            {needsEmailPermission ? (
                                <p className={styles.hint}>
                                    На странице Яндекса отметьте «Адрес электронной почты» и нажмите «Разрешить».
                                </p>
                            ) : null}
                            <Button title="Войти по email" full onClick={goEmailLogin} />
                        </>
                    ) : null}
                </div>
            </div>
        </>
    );
};

export default YandexAuthPage;
