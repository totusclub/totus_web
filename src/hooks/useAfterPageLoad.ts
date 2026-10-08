import { useEffect, useState } from 'react';

/**
 * true — страница загрузилась (событие load: картинка hero, шрифт и скрипты первого экрана уже
 * получены) и браузер освободился (requestIdleCallback, не дольше idleTimeoutMs).
 * Для второстепенных картинок первого экрана (фото отелей на телефоне): они не должны делить
 * медленный мобильный канал с главной картинкой (PageSpeed: LCP).
 * На случай очень долгого load — не позже maxWaitMs после монтирования.
 */
export function useAfterPageLoad(idleTimeoutMs = 1500, maxWaitMs = 8000): boolean {
    const [ready, setReady] = useState(false);

    useEffect(() => {
        if (typeof window === 'undefined') return undefined;
        let cancelled = false;
        let idleId: number | undefined;
        let idleTimer: number | undefined;
        const done = () => {
            if (!cancelled) setReady(true);
        };
        const afterLoad = () => {
            if (typeof window.requestIdleCallback === 'function') {
                idleId = window.requestIdleCallback(done, { timeout: idleTimeoutMs });
            } else {
                idleTimer = window.setTimeout(done, 200);
            }
        };
        const maxTimer = window.setTimeout(done, maxWaitMs);
        if (document.readyState === 'complete') afterLoad();
        else window.addEventListener('load', afterLoad, { once: true });

        return () => {
            cancelled = true;
            window.removeEventListener('load', afterLoad);
            window.clearTimeout(maxTimer);
            if (idleTimer !== undefined) window.clearTimeout(idleTimer);
            if (idleId !== undefined && typeof window.cancelIdleCallback === 'function') window.cancelIdleCallback(idleId);
        };
    }, [idleTimeoutMs, maxWaitMs]);

    return ready;
}
