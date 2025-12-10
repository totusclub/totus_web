import { useState, useEffect, useCallback } from 'react';

type Theme = 'light' | 'dark';

/**
 * Get initial theme synchronously (runs before React renders)
 * This prevents flash of wrong theme
 */
const getInitialTheme = (): Theme => {
    if (typeof window === 'undefined') return 'light';
    
    try {
        // Check localStorage first
        const saved = localStorage.getItem('theme') as Theme | null;
        if (saved === 'dark' || saved === 'light') {
            // Set immediately to prevent flash
            document.documentElement.setAttribute('data-theme', saved);
            return saved;
        }
    } catch (e) {
        // localStorage might not be available
    }
    
    // Default to light
    document.documentElement.setAttribute('data-theme', 'light');
    return 'light';
};

/**
 * Custom hook for managing theme state
 * Handles initialization, persistence, and cross-tab synchronization
 */
export const useTheme = () => {
    // Always start with 'light' to match server-side rendering
    // This prevents hydration mismatches
    const [theme, setTheme] = useState<Theme>('light');
    const [mounted, setMounted] = useState(false);

    // Set actual theme after mount (client-side only)
    useEffect(() => {
        if (typeof window === 'undefined') return;
        
        const current = getInitialTheme();
        setTheme(current);
        document.documentElement.setAttribute('data-theme', current);
        setMounted(true);
    }, []);

    // Listen for storage changes (cross-tab synchronization)
    useEffect(() => {
        if (typeof window === 'undefined') return;

        const handleStorageChange = (e: StorageEvent) => {
            if (e.key === 'theme' && e.newValue) {
                const newTheme = e.newValue as Theme;
                if (newTheme === 'dark' || newTheme === 'light') {
                    setTheme(newTheme);
                    document.documentElement.setAttribute('data-theme', newTheme);
                }
            }
        };

        window.addEventListener('storage', handleStorageChange);
        return () => window.removeEventListener('storage', handleStorageChange);
    }, []);

    const toggleTheme = useCallback(() => {
        setTheme((prev) => {
            const newTheme = prev === 'light' ? 'dark' : 'light';
            localStorage.setItem('theme', newTheme);
            document.documentElement.setAttribute('data-theme', newTheme);
            return newTheme;
        });
    }, []);

    const setThemeValue = useCallback((newTheme: Theme) => {
        if (newTheme === 'dark' || newTheme === 'light') {
            setTheme(newTheme);
            localStorage.setItem('theme', newTheme);
            document.documentElement.setAttribute('data-theme', newTheme);
        }
    }, []);

    return {
        theme,
        toggleTheme,
        setTheme: setThemeValue,
        mounted, // Useful to prevent hydration mismatches
    };
};

