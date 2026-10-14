import { useEffect, useState } from 'react';
import styles from './cookieConsent.module.css';
import { COOKIE_SETTINGS_OPEN_EVENT, hasCookieConsent, readCookieChoice, saveCookieChoice } from '@/utils/cookieConsent';
import { LEGAL_LINKS } from '@/config/legalLinks';

// Баннер cookie (макет «Согласия в формах», 14.10.2026): «Принять» и «Отклонить» равнозначны,
// «Настроить» — раздельно «Необходимые» (всегда) и «Аналитика» (Яндекс Метрика, по умолчанию выключена).
const CookieConsent = () => {
    const [visible, setVisible] = useState(false);
    const [settingsOpen, setSettingsOpen] = useState(false);
    const [analytics, setAnalytics] = useState(false);

    useEffect(() => {
        if (!hasCookieConsent()) setVisible(true);
        const reopen = () => {
            setAnalytics(readCookieChoice()?.analytics === true);
            setSettingsOpen(true);
            setVisible(true);
        };
        window.addEventListener(COOKIE_SETTINGS_OPEN_EVENT, reopen);
        return () => window.removeEventListener(COOKIE_SETTINGS_OPEN_EVENT, reopen);
    }, []);

    const choose = (allowAnalytics: boolean) => {
        saveCookieChoice(allowAnalytics);
        setVisible(false);
        setSettingsOpen(false);
    };

    if (!visible) return null;

    return (
        <div className={styles.banner} role="dialog" aria-label="Настройки cookie">
            <div className={`content ${styles.bannerInner}`}>
                <div className={styles.row}>
                    <p className={styles.text}>
                        Мы используем cookie, чтобы сайт работал, и — с вашего согласия — Яндекс Метрику, чтобы
                        понимать, как им пользуются.{' '}
                        <a href={LEGAL_LINKS.cookies} target="_blank" rel="noopener noreferrer" className={styles.link}>
                            Политика использования файлов cookie
                        </a>
                    </p>
                    <div className={styles.buttons}>
                        <button
                            type="button"
                            className={styles.btn}
                            aria-expanded={settingsOpen}
                            aria-controls="cookie-settings-panel"
                            onClick={() => setSettingsOpen((open) => !open)}
                        >
                            Настроить
                        </button>
                        <button type="button" className={styles.btn} onClick={() => choose(false)}>
                            Отклонить
                        </button>
                        <button type="button" className={`${styles.btn} ${styles.btnPrimary}`} onClick={() => choose(true)}>
                            Принять
                        </button>
                    </div>
                </div>
                {settingsOpen ? (
                    <div id="cookie-settings-panel" className={styles.settings}>
                        <label className={styles.settingsRow}>
                            <span>
                                Необходимые
                                <small>Вход, корзина, безопасность. Без них сайт не работает.</small>
                            </span>
                            <input className={styles.switch} type="checkbox" checked disabled aria-label="Необходимые cookie — всегда включены" />
                        </label>
                        <label className={styles.settingsRow}>
                            <span>
                                Аналитика
                                <small>Яндекс Метрика: посещаемость и удобство страниц.</small>
                            </span>
                            <input
                                className={styles.switch}
                                type="checkbox"
                                checked={analytics}
                                onChange={(e) => setAnalytics(e.target.checked)}
                                aria-label="Аналитика"
                            />
                        </label>
                        <div className={styles.settingsActions}>
                            <button type="button" className={`${styles.btn} ${styles.btnPrimary}`} onClick={() => choose(analytics)}>
                                Сохранить
                            </button>
                        </div>
                    </div>
                ) : null}
            </div>
        </div>
    );
};

export default CookieConsent;
