import { useCallback, useEffect, useState, useSyncExternalStore } from 'react';
import {
    getThemeSnapshot,
    SERVER_THEME_SNAPSHOT,
    setThemeMode,
    subscribeTheme,
    type ResolvedTheme,
    type ThemeMode,
} from '@/utils/theme';

/**
 * Тема оформления (общая для всех компонентов страницы, см. src/utils/theme.ts).
 * theme — итоговая тема ('light' | 'dark'), mode — выбор пользователя ('light' | 'dark' | 'system').
 * До гидрации — как на сервере ('system', светлая), поэтому mounted — для цветов, зависящих от темы.
 */
export const useTheme = () => {
    const snapshot = useSyncExternalStore(subscribeTheme, getThemeSnapshot, () => SERVER_THEME_SNAPSHOT);
    const [mode, theme] = snapshot.split(':') as [ThemeMode, ResolvedTheme];
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    const toggleTheme = useCallback(() => {
        setThemeMode(theme === 'dark' ? 'light' : 'dark');
    }, [theme]);

    const setTheme = useCallback((next: ThemeMode) => {
        setThemeMode(next);
    }, []);

    return {
        theme,
        mode,
        setMode: setTheme,
        toggleTheme,
        setTheme,
        mounted,
    };
};

/** Цвет тёмных иконок (стрелки, «назад», логотип в мобильной шапке): в тёмной теме — белый. */
export const useIconColor = (): string => {
    const { theme, mounted } = useTheme();
    return mounted && theme === 'dark' ? '#fff' : '#000';
};
