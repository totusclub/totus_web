// components/ScrollRestoration.tsx
"use client";
import { useEffect } from "react";
import { useRouter } from "next/router";

export default function ScrollRestoration() {
    const router = useRouter();

    useEffect(() => {
        window.history.scrollRestoration = "manual";

        const saveScroll = (url: string) => {
            const active = document.activeElement as HTMLElement | null;
            let scrollY = window.scrollY;

            // if a list item was clicked, store relative scroll
            const target = active?.dataset?.scrollItem;
            if (target) {
                const el = document.querySelector<HTMLElement>(`[data-scroll-item='${target}']`);
                if (el) {
                    scrollY = window.scrollY + el.getBoundingClientRect().top;
                }
            }

            sessionStorage.setItem(`scroll-${url}`, String(scrollY));
        };

        const restoreScroll = (url: string) => {
            const y = parseInt(sessionStorage.getItem(`scroll-${url}`) || "0");
            window.scrollTo(0, y);
        };

        const handleRouteChangeStart = () => saveScroll(router.asPath);
        const handleRouteChangeComplete = (url: string) => restoreScroll(url);

        router.events.on("routeChangeStart", handleRouteChangeStart);
        router.events.on("routeChangeComplete", handleRouteChangeComplete);
        window.addEventListener("popstate", () => restoreScroll(window.location.pathname));

        return () => {
            router.events.off("routeChangeStart", handleRouteChangeStart);
            router.events.off("routeChangeComplete", handleRouteChangeComplete);
        };
    }, [router]);

    return null;
}
