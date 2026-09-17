import React, { useEffect, useState } from 'react';
import styles from './auth.module.css';
import { isYandexAuthEnabled, yandexStartUrl } from '@/api/YandexAuthApi';

/**
 * «Войти с Яндекс ID» — уводит на сервер, который редиректит на Яндекс.
 * Пока раздел выключен на сервере (503), кнопки просто нет.
 */
const YandexIdButton: React.FC<{ label?: string; divider?: boolean }> = ({
    label = 'Войти с Яндекс ID',
    divider = true,
}) => {
    const [enabled, setEnabled] = useState(false);

    useEffect(() => {
        let alive = true;
        isYandexAuthEnabled().then((value) => {
            if (alive) setEnabled(value);
        });
        return () => {
            alive = false;
        };
    }, []);

    if (!enabled) return null;

    const handleClick = () => {
        if (typeof window === 'undefined') return;
        const returnPath = `${window.location.pathname}${window.location.search}`;
        window.location.href = yandexStartUrl(returnPath || '/');
    };

    return (
        <>
            {divider ? (
                <div className={styles.authCardLine}>
                    <div />
                    <p>или</p>
                    <div />
                </div>
            ) : null}
            <button type="button" className={styles.yandexButton} onClick={handleClick}>
                <span className={styles.yandexLogo} aria-hidden="true">Я</span>
                <span>{label}</span>
            </button>
        </>
    );
};

export default YandexIdButton;
