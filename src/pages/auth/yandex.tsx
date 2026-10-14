/**
 * Страница возврата после входа через Яндекс ID.
 *
 * Сервер приводит сюда с одноразовым ticket (или с error). Сами токены в URL
 * не попадают: страница меняет ticket через POST /api/auth/yandex/exchange,
 * кладёт токены в localStorage (как после кода из письма) и возвращает туда,
 * откуда начинали. Макеты — claude/YANDEX_AUTH_DESIGN_RU.md.
 *
 * Новый пользователь (isNew) на шаге «Почти готово» даёт согласие на обработку персональных данных
 * (обязательно) и на рекламу (по желанию) — макет «Согласия в формах», 14.10.2026. Телефон можно
 * пропустить, согласие — нет: «Отказаться и выйти» завершает сеанс.
 */
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/router';
import { useDispatch } from 'react-redux';
import Head from 'next/head';
import styles from './yandex.module.css';
import Button from '@/components/UI/button';
import Input from '@/components/UI/input';
import { setAuth, logout } from '@/store/slices/authSlice';
import { decodeToken, deleteToken, saveToken, saveRefreshToken } from '@/utils/auth';
import { getMe } from '@/api/AuthApi';
import { yandexExchange, updateProfilePhone, yandexStartUrl } from '@/api/YandexAuthApi';
import { formatRuPhoneInput, normalizeRuPhone, RU_PHONE_HINT } from '@/utils/phone';
import { yandexAuthErrorText, yandexExchangeErrorCode } from '@/utils/yandexAuthErrors';
import { saveConsents } from '@/api/consentsApi';
import ConsentCheckbox, { ConsentAdsText, ConsentPdText, TermsNote } from '@/components/UI/consentCheckbox';

type Stage = 'loading' | 'phone' | 'consent' | 'error';

function safePath(value: unknown): string {
    const raw = typeof value === 'string' ? value : '';
    if (!raw.startsWith('/') || raw.startsWith('//')) return '/';
    return raw;
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
    const [pdConsent, setPdConsent] = useState(false);
    const [adsConsent, setAdsConsent] = useState(false);
    const [consentError, setConsentError] = useState('');

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

                // Новый аккаунт создан по данным Яндекса — согласие собираем здесь же (вместе с телефоном).
                if (data.isNew) {
                    setStage('consent');
                    return;
                }
                if (data.needsPhone) {
                    setStage('phone');
                    return;
                }
                finish(path);
            })
            .catch((error: any) => {
                // Тайм-аут и сетевой сбой тоже ведут на экран ошибки с «Попробовать снова».
                setErrorCode(yandexExchangeErrorCode(error));
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

    /** «Продолжить» на шаге согласия: телефон — если введён, согласия — в журнал (POST /api/consents). */
    const handleConsentContinue = async () => {
        if (!pdConsent || saving) return;
        let normalized = '';
        if (phone.trim()) {
            normalized = normalizeRuPhone(phone) || '';
            if (!normalized) {
                setPhoneError(RU_PHONE_HINT);
                return;
            }
        }
        setPhoneError('');
        setConsentError('');
        setSaving(true);
        try {
            await saveConsents('signup_yandex', { pd: true, ads: adsConsent });
        } catch {
            setConsentError('Не удалось сохранить согласие. Проверьте интернет и попробуйте ещё раз.');
            setSaving(false);
            return;
        }
        if (normalized) {
            try {
                const data = await updateProfilePhone(normalized);
                const token = data?.accessToken || data?.authToken;
                if (token) {
                    saveToken(token);
                    if (data.refreshToken) saveRefreshToken(data.refreshToken);
                    dispatch(setAuth({ token, user: decodeToken(token) }));
                }
            } catch (error: any) {
                setPhoneError(
                    error?.response?.data?.error === 'phone_invalid'
                        ? error?.response?.data?.message || RU_PHONE_HINT
                        : 'Не удалось сохранить номер',
                );
                setSaving(false);
                return;
            }
        }
        setSaving(false);
        finish(returnPath);
    };

    /** «Отказаться и выйти»: без согласия аккаунтом не пользуемся — выходим. */
    const handleDecline = () => {
        deleteToken();
        dispatch(logout());
        if (typeof window !== 'undefined' && (window as any).ReactNativeWebView?.postMessage) {
            (window as any).ReactNativeWebView.postMessage('logout');
        }
        router.replace('/');
    };

    const error = yandexAuthErrorText(errorCode);

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

                    {stage === 'consent' ? (
                        <>
                            <h1 className={styles.title}>Почти готово</h1>
                            <p className={styles.text}>
                                Добавьте телефон — он нужен для оформления заказа и связи по бронированию. Телефон можно
                                добавить позже.
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
                            <ConsentCheckbox id="yandex-consent-pd" checked={pdConsent} onChange={setPdConsent} required>
                                <ConsentPdText />
                            </ConsentCheckbox>
                            <ConsentCheckbox id="yandex-consent-ads" checked={adsConsent} onChange={setAdsConsent}>
                                <ConsentAdsText />
                            </ConsentCheckbox>
                            {consentError ? <p className={styles.consentError} role="alert">{consentError}</p> : null}
                            <Button
                                title="Продолжить"
                                full
                                loading={saving}
                                disabled={!pdConsent || saving}
                                onClick={handleConsentContinue}
                            />
                            <TermsNote verb="Продолжая" />
                            <button type="button" className={styles.link} onClick={handleDecline}>
                                Отказаться и выйти
                            </button>
                        </>
                    ) : null}

                    {stage === 'error' ? (
                        <>
                            <h1 className={styles.title}>Не получилось войти</h1>
                            <div className={styles.error}>
                                <p className={styles.errorTitle}>{error.title}</p>
                                <p className={styles.errorText}>{error.text}</p>
                            </div>
                            <button
                                type="button"
                                className={styles.yandexButton}
                                onClick={() => {
                                    window.location.href = yandexStartUrl(returnPath);
                                }}
                            >
                                <span className={styles.logoSmall} aria-hidden="true">Я</span>
                                <span>Попробовать снова</span>
                            </button>
                            <Button title="Войти по email" full onClick={() => finish(returnPath)} />
                        </>
                    ) : null}
                </div>
            </div>
        </>
    );
};

export default YandexAuthPage;
