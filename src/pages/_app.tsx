import type { AppProps } from 'next/app';
import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import Script from 'next/script'; // ✅ ADD
import { useRouter } from 'next/router';
import { wrapper } from '../store';
import '../styles/globals.css';
// Тема слайдеров без шрифта slick (см. файл); вместо slick-carousel/slick/slick-theme.css в компонентах
import '../styles/slick-theme.css';
import '@/utils/themeInit';
import '@/api/http'; // Bearer + refresh для всех запросов к totus_API
import Header from '@/components/header';
import Footer from '@/components/footer';
import { decodeToken, loadToken, isTokenAlive } from "@/utils/auth";
import { setAuth, logout } from "@/store/slices/authSlice";
import { getMe } from '@/api/AuthApi';
import { AUTH_LOGOUT_EVENT } from '@/api/http';
import { useDispatch } from "react-redux";
import MobileBottomBar from "@/components/mobileBottomBar";
import SiteSeo from "@/components/seo/SiteSeo";
import CookieConsent from "@/components/cookieConsent";
import { COOKIE_CONSENT_EVENT, clearMetrikaCookies, hasAnalyticsConsent, type CookieChoice } from '@/utils/cookieConsent';
import SupportCallProvider, { CallingOnly } from '@/components/support/SupportCallProvider';
import AuthOnly from '@/components/AuthOnly';
import { useStopSearchPollOnLeave } from '@/hooks/useStopSearchPollOnLeave';
// import ScrollRestoration from '@/components/ScrollRestoration';

// Только для вошедших: отдельные чанки, гостям не загружаются (Мила, сокет поддержки, уведомления).
const GlobalAiChat = dynamic(() => import('@/components/GlobalAiChat'), { ssr: false });
const SupportChatGate = dynamic(() => import('@/components/support/SupportChatGate'), { ssr: false });
const NotificationsBridge = dynamic(() => import('@/components/notifications/NotificationsBridge'), { ssr: false });

function MyApp({ Component, pageProps }: AppProps) {
    const dispatch = useDispatch();
    const router = useRouter();
    // Только /ai и /ai/* (переадресации Милы). Проверка по префиксу «/ai» без слэша задевала /airlines и /airline-fees.
    const isAiRoute = router.pathname === '/ai' || router.pathname.startsWith('/ai/');
    useStopSearchPollOnLeave();
    // Яндекс Метрика — только после согласия на аналитику в cookie-баннере (Политика cookie, п. 4.2).
    const [analyticsAllowed, setAnalyticsAllowed] = useState(false);

    useEffect(() => {
        let allowedNow = hasAnalyticsConsent();
        setAnalyticsAllowed(allowedNow);
        const onChoice = (event: Event) => {
            const allowed = (event as CustomEvent<CookieChoice>).detail?.analytics === true;
            // Отозвали согласие после запуска счётчика: удалить его cookie и перезагрузить страницу без него.
            if (allowedNow && !allowed) {
                clearMetrikaCookies();
                window.location.reload();
                return;
            }
            allowedNow = allowed;
            setAnalyticsAllowed(allowed);
        };
        window.addEventListener(COOKIE_CONSENT_EVENT, onChoice);
        return () => window.removeEventListener(COOKIE_CONSENT_EVENT, onChoice);
    }, []);

    useEffect(() => {
        const token = loadToken();
        if (token && isTokenAlive(token)) {
            // 1) мгновенно — профиль из payload токена (как раньше)
            const user = decodeToken(token);
            dispatch(setAuth({ token, user }));
            // 2) затем — актуальный профиль с сервера (/api/auth/me)
            let cancelled = false;
            getMe().then((profile) => {
                if (!cancelled && profile) {
                    dispatch(setAuth({ token, user: { ...user, ...profile } }));
                }
            });
            return () => {
                cancelled = true;
            };
        }
    }, [dispatch]);

    // Interceptor не смог обновить токен → разлогиниваем Redux
    useEffect(() => {
        const onLogout = () => dispatch(logout());
        window.addEventListener(AUTH_LOGOUT_EVENT, onLogout);
        return () => window.removeEventListener(AUTH_LOGOUT_EVENT, onLogout);
    }, [dispatch]);

    return (
        <>
            <SiteSeo pageProps={pageProps} />
            {/* Яндекс Метрика — только после согласия на аналитику (cookie-баннер); без согласия скрипт и пиксель
                не выводятся вовсе. Очередь ym() и init — сразу после согласия, сам tag.js (~64 КБ, вебвизор) — после
                события load и паузы браузера (requestIdleCallback, не позже 3 с; без него — через 1,5 с), чтобы не
                попадать в LCP на телефоне. Пиксель для браузеров без JavaScript убран: без JavaScript согласие не дать. */}
            {analyticsAllowed && (
                <Script
                    id="yandex-metrika"
                    strategy="afterInteractive"
                    dangerouslySetInnerHTML={{
                        __html: `
                            (function(m,e,t,r,i){
                                m[i]=m[i]||function(){(m[i].a=m[i].a||[]).push(arguments)};
                                m[i].l=1*new Date();
                                function loadTag(){
                                    for (var j = 0; j < e.scripts.length; j++) {
                                        if (e.scripts[j].src === r) { return; }
                                    }
                                    var k=e.createElement(t),a=e.getElementsByTagName(t)[0];
                                    k.async=1;k.src=r;a.parentNode.insertBefore(k,a);
                                }
                                function whenIdle(){
                                    if (m.requestIdleCallback) { m.requestIdleCallback(loadTag, { timeout: 3000 }); }
                                    else { setTimeout(loadTag, 1500); }
                                }
                                if (e.readyState === 'complete') { whenIdle(); }
                                else { m.addEventListener('load', whenIdle, { once: true }); }
                            })(window, document,'script','https://mc.yandex.ru/metrika/tag.js?id=106173650', 'ym');

                            ym(106173650, 'init', {
                                ssr:true,
                                webvisor:true,
                                clickmap:true,
                                ecommerce:"dataLayer",
                                accurateTrackBounce:true,
                                trackLinks:true
                            });
                        `,
                    }}
                />
            )}

            <div id="root">
                {/* <ScrollRestoration /> */}

                <SupportCallProvider>
                {!isAiRoute && <Header heroTitle={pageProps?.homeHero?.title ?? null} />}
                <Component {...pageProps} />
                {!isAiRoute && <Footer />}
                {!isAiRoute && <MobileBottomBar />}
                {!isAiRoute && <CookieConsent />}
                <AuthOnly>
                {/* Мила FAB on all site pages; /ai home redirects to / */}
                {!isAiRoute && <GlobalAiChat />}
                {/* Чат с поддержкой: сокет + счётчик непрочитанных (без UI) — только при «Доступ» в Calling Admin */}
                <CallingOnly>
                <SupportChatGate />
                </CallingOnly>
                {/* Уведомления: непрочитанные, notify:* на сокете, service worker, тосты */}
                <NotificationsBridge />
                </AuthOnly>
                </SupportCallProvider>
            </div>
        </>
    );
}

export default wrapper.withRedux(MyApp);
