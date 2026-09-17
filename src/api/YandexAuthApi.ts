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
 * Раздел включён? Ответы /api/auth/yandex/status:
 *   200 / 401 / 403 — маршруты есть, раздел работает → кнопка показывается;
 *   503 — нет настроек или миграции; 404 — роутер ещё не смонтирован в app.js;
 *   сеть недоступна — тоже считаем выключенным.
 *
 * Запрос идёт отдельным экземпляром axios — без глобальных интерсепторов (‘@/api/http’),
 * чтобы проба ни при каких ответах не трогала сессию (401 → refresh → возможный выход).
 * Результат кэшируется на жизнь страницы: один запрос, а не по одному на каждое открытие модалки.
 */
const probeClient = axios.create({ timeout: 8000, validateStatus: () => true });
let enabledPromise: Promise<boolean> | null = null;

export function isYandexAuthEnabled(): Promise<boolean> {
    if (!enabledPromise) {
        enabledPromise = probeClient
            .get(`${BASE_URL}/api/auth/yandex/status`)
            .then(response => [200, 401, 403].includes(response.status))
            .catch(() => false);
    }
    return enabledPromise;
}
