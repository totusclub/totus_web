import { useSyncExternalStore } from 'react';

/**
 * Заголовок hero главной, общий для Search (hero-блок) и Header.
 *
 * Search получает его с бэкенда (getHomeHero) и публикует сюда, Header на Desktop
 * показывает тот же текст — второго запроса к API нет.
 * null — ответ бэкенда ещё не пришёл (текст скрыт, чтобы не мелькало значение по умолчанию).
 */
let currentTitle: string | null = null;
const listeners = new Set<() => void>();

export function publishHomeHeroTitle(title: string | null): void {
    if (title === currentTitle) return;
    currentTitle = title;
    listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void): () => void {
    listeners.add(listener);
    return () => {
        listeners.delete(listener);
    };
}

const getSnapshot = () => currentTitle;
const getServerSnapshot = (): string | null => null;

export function useHomeHeroTitle(): string | null {
    return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
