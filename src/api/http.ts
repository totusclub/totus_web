/**
 * Единая точка авторизации HTTP-запросов к totus_API (SECURITY_JWT_PLAN_RU.md, волна 1).
 *
 * Ставит interceptors на глобальный axios (им пользуются все модули src/api и slices):
 *  - request: добавляет `Authorization: Bearer <auth_token>` ко всем запросам на API_BASE_URL
 *    (к voip / Level.Travel / другим хостам токен не уходит);
 *  - response: на 401 от API один раз пробует /api/auth/refresh и повторяет запрос;
 *    если refresh не удался — чистит сессию и шлёт событие `totus:auth-logout`
 *    (его слушает _app.tsx и разлогинивает Redux).
 *
 * Подключается один раз через `import '@/api/http'` в _app.tsx. На сервере (SSR) ничего не делает.
 */
import axios, { AxiosError, AxiosRequestConfig, InternalAxiosRequestConfig } from 'axios';
import { API_BASE_URL } from '@/config/api';
import {
    loadToken,
    saveToken,
    loadRefreshToken,
    saveRefreshToken,
    clearSession,
} from '@/utils/auth';

export const AUTH_LOGOUT_EVENT = 'totus:auth-logout';

type RetriableConfig = InternalAxiosRequestConfig & { _authRetried?: boolean };

const apiOrigin = API_BASE_URL.replace(/\/+$/, '');

function isApiRequest(config: AxiosRequestConfig): boolean {
    const url = String(config.url || '');
    if (!url) return false;
    if (url.startsWith(apiOrigin)) return true;
    // Относительный URL + baseURL, указывающий на API
    if (!/^https?:\/\//i.test(url)) {
        const base = String(config.baseURL || '');
        return !base || base.startsWith(apiOrigin);
    }
    return false;
}

let refreshPromise: Promise<string | null> | null = null;

async function refreshAccessToken(): Promise<string | null> {
    const refreshToken = loadRefreshToken();
    if (!refreshToken) return null;
    try {
        // Без interceptors, чтобы не зациклиться на 401
        const response = await axios.create().post(`${apiOrigin}/api/auth/refresh`, { refreshToken });
        const nextToken: string | undefined = response.data?.accessToken || response.data?.authToken;
        if (!nextToken) return null;
        saveToken(nextToken);
        if (response.data?.refreshToken) saveRefreshToken(response.data.refreshToken);
        return nextToken;
    } catch {
        return null;
    }
}

export function logoutEverywhere() {
    clearSession();
    if (typeof window !== 'undefined') {
        window.dispatchEvent(new Event(AUTH_LOGOUT_EVENT));
    }
}

let installed = false;

export function installAuthInterceptors() {
    if (installed || typeof window === 'undefined') return;
    installed = true;

    axios.interceptors.request.use((config) => {
        if (!isApiRequest(config)) return config;
        const token = loadToken();
        if (token && !config.headers?.Authorization) {
            config.headers = config.headers ?? ({} as InternalAxiosRequestConfig['headers']);
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    });

    axios.interceptors.response.use(
        (response) => response,
        async (error: AxiosError) => {
            const config = error.config as RetriableConfig | undefined;
            const status = error.response?.status;

            if (status !== 401 || !config || config._authRetried || !isApiRequest(config) || !loadToken()) {
                return Promise.reject(error);
            }

            config._authRetried = true;
            if (!refreshPromise) {
                refreshPromise = refreshAccessToken().finally(() => {
                    refreshPromise = null;
                });
            }
            const nextToken = await refreshPromise;
            if (nextToken) {
                config.headers = config.headers ?? ({} as InternalAxiosRequestConfig['headers']);
                config.headers.Authorization = `Bearer ${nextToken}`;
                return axios(config);
            }

            logoutEverywhere();
            return Promise.reject(error);
        },
    );
}

installAuthInterceptors();
