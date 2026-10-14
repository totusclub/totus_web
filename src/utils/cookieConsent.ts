// Выбор посетителя в cookie-баннере (Политика использования файлов cookie, п. 4).
// Необходимые cookie работают всегда; Яндекс Метрика — только после согласия на аналитику.
// Выбор хранится 12 месяцев, потом баннер показывается снова.
// Файл без импортов: проверка scripts/check-consents.mjs загружает его напрямую в Node.

export const COOKIE_CONSENT_KEY = 'cookie_consent';
/** Версия текста баннера. Поменялась — спрашиваем заново. */
export const COOKIE_CONSENT_VERSION = 2;
export const COOKIE_CONSENT_TTL_MS = 365 * 24 * 60 * 60 * 1000;
/** Выбор сохранён: detail = CookieChoice. */
export const COOKIE_CONSENT_EVENT = 'totus:cookie-consent';
/** «Настройки cookie» в подвале: открыть баннер с настройками. */
export const COOKIE_SETTINGS_OPEN_EVENT = 'totus:cookie-settings-open';

export type CookieChoice = { v: number; analytics: boolean; at: number };

/** Разбор сохранённого значения. Старое «accepted» (согласие «продолжая пользоваться») не считается. */
export function parseCookieChoice(raw: string | null, now: number = Date.now()): CookieChoice | null {
    if (!raw) return null;
    try {
        const data = JSON.parse(raw);
        if (!data || typeof data !== 'object') return null;
        if (data.v !== COOKIE_CONSENT_VERSION) return null;
        if (typeof data.analytics !== 'boolean' || typeof data.at !== 'number') return null;
        if (now - data.at > COOKIE_CONSENT_TTL_MS || data.at > now + 60_000) return null;
        return { v: data.v, analytics: data.analytics, at: data.at };
    } catch {
        return null;
    }
}

export function readCookieChoice(): CookieChoice | null {
    if (typeof window === 'undefined') return null;
    try {
        return parseCookieChoice(window.localStorage.getItem(COOKIE_CONSENT_KEY));
    } catch {
        return null;
    }
}

/** Выбор уже сделан? На сервере — «да», чтобы баннер не мигал в HTML. */
export function hasCookieConsent(): boolean {
    if (typeof window === 'undefined') return true;
    return readCookieChoice() !== null;
}

export function hasAnalyticsConsent(): boolean {
    return readCookieChoice()?.analytics === true;
}

export function saveCookieChoice(analytics: boolean): CookieChoice {
    const choice: CookieChoice = { v: COOKIE_CONSENT_VERSION, analytics, at: Date.now() };
    try {
        window.localStorage.setItem(COOKIE_CONSENT_KEY, JSON.stringify(choice));
    } catch {
        // localStorage недоступен — выбор действует до перезагрузки страницы
    }
    try {
        window.dispatchEvent(new CustomEvent(COOKIE_CONSENT_EVENT, { detail: choice }));
    } catch {
        // старые браузеры без CustomEvent
    }
    return choice;
}

export function openCookieSettings(): void {
    try {
        window.dispatchEvent(new Event(COOKIE_SETTINGS_OPEN_EVENT));
    } catch {
        // нет window
    }
}

/** Отзыв согласия на аналитику: удалить cookie Яндекс Метрики (_ym_*) на этом сайте. */
export function clearMetrikaCookies(): void {
    try {
        const host = window.location.hostname;
        const domains = ['', host, `.${host.split('.').slice(-2).join('.')}`];
        for (const part of document.cookie.split(';')) {
            const name = part.split('=')[0].trim();
            if (!name.startsWith('_ym')) continue;
            for (const d of domains) {
                document.cookie = `${name}=; Max-Age=0; path=/${d ? `; domain=${d}` : ''}`;
            }
        }
    } catch {
        // нет document
    }
}
