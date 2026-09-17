/**
 * Вход через Яндекс ID (docs/YANDEX_AUTH_API.md в totus_API).
 *
 * Код на токен меняет только сервер. Сайт уводит пользователя на /start,
 * потом получает одноразовый ticket на /auth/yandex и меняет его на наши
 * обычные токены — те же, что после кода из письма.
 */
import axios from 'axios';
import { API_BASE_URL } from '@/config/api';

const BASE_URL = API_BASE_URL;

export interface YandexExchangeResult {
    auth?: boolean;
    authToken?: string;
    accessToken?: string;
    refreshToken?: string;
    user?: Record<string, any> | null;
    isNew?: boolean;
    needsPhone?: boolean;
}

/** Куда ведёт кнопка: сервер сам редиректит на oauth.yandex.ru. */
export function yandexStartUrl(returnPath = '/'): string {
    const safe = returnPath.startsWith('/') && !returnPath.startsWith('//') ? returnPath : '/';
    return `${BASE_URL}/api/auth/yandex/start?client=web&return=${encodeURIComponent(safe)}`;
}

export async function yandexExchange(ticket: string): Promise<YandexExchangeResult> {
    const response = await axios.post(`${BASE_URL}/api/auth/yandex/exchange`, { ticket });
    return response.data;
}

/** Шаг «Почти готово»: телефон у нового пользователя (Яндекс его не отдаёт). */
export async function updateProfilePhone(phone: string) {
    const response = await axios.patch(`${BASE_URL}/api/auth/me/phone`, { phone });
    return response.data;
}

/**
 * Раздел включён? Пока на сервере нет настроек, /status отвечает 503 — кнопку не показываем.
 * Когда всё готово, он отвечает 200 (есть токен) или 401 (гость). Ответ кэшируем на сессию.
 */
let enabledCache: boolean | null = null;

export async function isYandexAuthEnabled(): Promise<boolean> {
    if (enabledCache !== null) return enabledCache;
    try {
        await axios.get(`${BASE_URL}/api/auth/yandex/status`);
        enabledCache = true;
    } catch (error: any) {
        const status = error?.response?.status;
        enabledCache = status === 401 || status === 403;
    }
    return enabledCache;
}
