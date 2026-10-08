/**
 * Тема оформления сайта: «Светлая», «Тёмная» или «Системная» (по умолчанию).
 *
 * Выбор хранится в localStorage (THEME_STORAGE_KEY). Нет значения — «Системная»: тема берётся из
 * настроек устройства (prefers-color-scheme) и меняется вместе с ними без перезагрузки.
 * На <html> всегда ставится итоговая тема data-theme="light" | "dark" — все стили сайта
 * ([data-theme="dark"] в globals.css и модулях) работают как раньше.
 *
 * До отрисовки страницы тему ставит THEME_INIT_SCRIPT (в _document) — без белой вспышки.
 * Старый ключ 'theme' (переключатель «Тёмная тема») больше не читается: всем — «Системная».
 */
export type ThemeMode = 'light' | 'dark' | 'system';
export type ResolvedTheme = 'light' | 'dark';

export const THEME_STORAGE_KEY = 'themeMode';
export const LEGACY_THEME_STORAGE_KEY = 'theme';
export const DARK_SCHEME_QUERY = '(prefers-color-scheme: dark)';
/** Цвет панели браузера на телефоне — фон страницы (--bgPrimary) в каждой теме. */
export const THEME_COLOR: Record<ResolvedTheme, string> = { light: '#ffffff', dark: '#141414' };

export function parseThemeMode(value: unknown): ThemeMode {
    return value === 'light' || value === 'dark' ? value : 'system';
}

export function resolveTheme(mode: ThemeMode, systemDark: boolean): ResolvedTheme {
    if (mode === 'system') return systemDark ? 'dark' : 'light';
    return mode;
}

/** Выполняется в <head> до отрисовки (та же логика, что parseThemeMode + resolveTheme). */
export const THEME_INIT_SCRIPT =
    "(function(){try{var m=localStorage.getItem('" + THEME_STORAGE_KEY + "');" +
    "if(m!=='light'&&m!=='dark')m='system';" +
    "var d=m==='dark'||(m==='system'&&!!window.matchMedia&&window.matchMedia('" + DARK_SCHEME_QUERY + "').matches);" +
    "var t=d?'dark':'light';var r=document.documentElement;" +
    "r.setAttribute('data-theme',t);r.style.colorScheme=t;}catch(e){}})();";

let mode: ThemeMode = 'system';
let resolved: ResolvedTheme = 'light';
let started = false;
const listeners = new Set<() => void>();

function systemPrefersDark(): boolean {
    try {
        return typeof window.matchMedia === 'function' && window.matchMedia(DARK_SCHEME_QUERY).matches;
    } catch {
        return false;
    }
}

function readStoredMode(): ThemeMode {
    try {
        return parseThemeMode(window.localStorage.getItem(THEME_STORAGE_KEY));
    } catch {
        return 'system';
    }
}

function applyTheme() {
    resolved = resolveTheme(mode, systemPrefersDark());
    const root = document.documentElement;
    root.setAttribute('data-theme', resolved);
    root.style.colorScheme = resolved;
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute('content', THEME_COLOR[resolved]);
    listeners.forEach((listener) => listener());
}

/** Один раз в браузере: прочитать выбор, применить, слушать смену темы устройства и другие вкладки. */
export function initTheme() {
    if (typeof window === 'undefined' || started) return;
    started = true;
    mode = readStoredMode();
    try {
        window.localStorage.removeItem(LEGACY_THEME_STORAGE_KEY);
    } catch {
        /* хранилище недоступно — не важно */
    }
    applyTheme();

    const onSystemChange = () => {
        if (mode === 'system') applyTheme();
    };
    try {
        const query = window.matchMedia?.(DARK_SCHEME_QUERY);
        if (query?.addEventListener) query.addEventListener('change', onSystemChange);
        else query?.addListener?.(onSystemChange);
    } catch {
        /* старый браузер без matchMedia — остаётся светлая */
    }
    window.addEventListener('storage', (event) => {
        if (event.key === THEME_STORAGE_KEY) {
            mode = parseThemeMode(event.newValue);
            applyTheme();
        }
    });
}

export function setThemeMode(next: ThemeMode) {
    if (typeof window === 'undefined') return;
    initTheme();
    mode = parseThemeMode(next);
    try {
        if (mode === 'system') window.localStorage.removeItem(THEME_STORAGE_KEY);
        else window.localStorage.setItem(THEME_STORAGE_KEY, mode);
    } catch {
        /* приватный режим — тема действует до перезагрузки */
    }
    applyTheme();
}

export function subscribeTheme(listener: () => void) {
    initTheme();
    listeners.add(listener);
    return () => {
        listeners.delete(listener);
    };
}

/** Снимок для useSyncExternalStore: "<выбор>:<итоговая тема>". */
export function getThemeSnapshot(): string {
    return `${mode}:${resolved}`;
}

export const SERVER_THEME_SNAPSHOT = 'system:light';
