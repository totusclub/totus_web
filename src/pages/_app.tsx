import type { AppProps } from 'next/app';
import { useEffect } from 'react';
import Script from 'next/script'; // ✅ ADD
import { useRouter } from 'next/router';
import { wrapper } from '../store';
import '../styles/globals.css';
import '@/utils/themeInit';
import Header from '@/components/header';
import Footer from '@/components/footer';
import { decodeToken, loadToken } from "@/utils/auth";
import { setAuth } from "@/store/slices/authSlice";
import { useDispatch } from "react-redux";
import MobileBottomBar from "@/components/mobileBottomBar";
import SiteSeo from "@/components/seo/SiteSeo";
import CookieConsent from "@/components/cookieConsent";
import { useStopSearchPollOnLeave } from '@/hooks/useStopSearchPollOnLeave';
// import ScrollRestoration from '@/components/ScrollRestoration';

function MyApp({ Component, pageProps }: AppProps) {
    const dispatch = useDispatch();
    const router = useRouter();
    const isAiRoute = router.pathname.startsWith('/ai');
    useStopSearchPollOnLeave();

    useEffect(() => {
        const token = loadToken();
        if (token) {
            const user = decodeToken(token);
            if (user && user?.exp * 1000 > Date.now()) {
                dispatch(setAuth({ token, user }));
            }
        }
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
            </div>
        </>
    );
}

export default wrapper.withRedux(MyApp);
