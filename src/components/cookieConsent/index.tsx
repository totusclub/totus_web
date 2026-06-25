import { useEffect, useState } from 'react';
import styles from './cookieConsent.module.css';
import { acceptCookieConsent, hasCookieConsent } from '@/utils/cookieConsent';

const CookieConsent = () => {
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        if (!hasCookieConsent()) {
            setVisible(true);
        }
    }, []);

    const handleAccept = () => {
        acceptCookieConsent();
        setVisible(false);
    };

    if (!visible) return null;

    return (
        <div className={styles.banner} role="dialog" aria-label="Согласие на использование cookie">
            <div className={`content ${styles.bannerInner}`}>
                <p className={styles.text}>
                    Сайт использует файлы cookie. Продолжая пользоваться сайтом, вы даёте согласие на
                    обработку файлов cookie.
                </p>
                <button type="button" className={styles.acceptBtn} onClick={handleAccept}>
                    Согласен
                </button>
            </div>
        </div>
    );
};

export default CookieConsent;
