import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * true, когда элемент впервые оказался рядом с экраном (rootMargin), и дальше остаётся true.
 * Для картинок-фонов ниже первого экрана: не грузить их, пока до них не дошли
 * (PageSpeed: они отнимали канал у главной картинки и шрифтов на телефоне).
 * Элемент с display:none (например, desktop-список на телефоне) не загрузится вовсе.
 * Без IntersectionObserver (очень старые браузеры) — сразу true.
 */
export function useNearViewport<T extends Element = HTMLDivElement>(
    rootMargin = '200px 0px',
): [(node: T | null) => void, boolean] {
    const [visible, setVisible] = useState(false);
    const observerRef = useRef<IntersectionObserver | null>(null);

    const ref = useCallback(
        (node: T | null) => {
            observerRef.current?.disconnect();
            observerRef.current = null;
            if (!node || visible) return;
            if (typeof window === 'undefined' || typeof window.IntersectionObserver === 'undefined') {
                setVisible(true);
                return;
            }
            const observer = new window.IntersectionObserver(
                (entries) => {
                    if (entries.some((entry) => entry.isIntersecting)) {
                        setVisible(true);
                        observer.disconnect();
                    }
                },
                { rootMargin },
            );
            observer.observe(node);
            observerRef.current = observer;
        },
        [rootMargin, visible],
    );

    useEffect(() => () => observerRef.current?.disconnect(), []);

    return [ref, visible];
}
