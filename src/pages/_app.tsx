import type { AppProps } from 'next/app';
import { useEffect } from 'react';
import Script from 'next/script'; // ✅ ADD
import { useRouter } from 'next/router';
import { wrapper } from '../store';
import '../styles/globals.css';
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
import GlobalAiChat from '@/components/GlobalAiChat';
import SupportChatGate from '@/components/support/SupportChatGate';
import { useStopSearchPollOnLeave } from '@/hooks/useStopSearchPollOnLeave';
// import ScrollRestoration from '@/components/ScrollRestoration';

function MyApp({ Component, pageProps }: AppProps) {
    const dispatch = useDispatch();
    const router = useRouter();
    const isAiRoute = router.pathname.startsWith('/ai');
    useStopSearchPollOnLeave();

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
            <Script
                id="yandex-metrika"
                strategy="afterInteractive"
                dangerouslySetInnerHTML={{
                    __html: `
                        (function(m,e,t,r,i,k,a){
                            m[i]=m[i]||function(){(m[i].a=m[i].a||[]).push(arguments)};
                            m[i].l=1*new Date();
                            for (var j = 0; j < document.scripts.length; j++) {
                                if (document.scripts[j].src === r) { return; }
                            }
                            k=e.createElement(t),a=e.getElementsByTagName(t)[0],
                            k.async=1,k.src=r,a.parentNode.insertBefore(k,a)
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

            {/* ✅ Noscript fallback */}
            <noscript>
                <div>
                    <img
                        src="https://mc.yandex.ru/watch/106173650"
                        style={{ position: 'absolute', left: '-9999px' }}
                        alt=""
                    />
                </div>
            </noscript>

            <div id="root">
                {/* <ScrollRestoration /> */}

                {!isAiRoute && <Header />}
                <Component {...pageProps} />
                {!isAiRoute && <Footer />}
                {!isAiRoute && <MobileBottomBar />}
                {!isAiRoute && <CookieConsent />}
                {/* Мила FAB on all site pages; /ai home redirects to / */}
                {!isAiRoute && <GlobalAiChat />}
                {/* Чат с поддержкой: сокет + счётчик непрочитанных (без UI) */}
                <SupportChatGate />
            </div>
        </>
    );
}

export default wrapper.withRedux(MyApp);
