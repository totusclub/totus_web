// utils/auth.js
import {jwtDecode} from 'jwt-decode';

const TOKEN_KEY = 'auth_token';
const REFRESH_KEY = 'refresh_token';

const hasStorage = () => typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';

export const saveToken = (token) => {
    if (!hasStorage()) return;
    localStorage.setItem(TOKEN_KEY, token);
};

export const loadToken = () => {
    if (!hasStorage()) return null;
    return localStorage.getItem(TOKEN_KEY);
};

export const deleteToken = () => {
    if (!hasStorage()) return;
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(REFRESH_KEY);
};

export const saveRefreshToken = (token) => {
    if (!hasStorage() || !token) return;
    localStorage.setItem(REFRESH_KEY, token);
};

export const loadRefreshToken = () => {
    if (!hasStorage()) return null;
    return localStorage.getItem(REFRESH_KEY);
};

// Полная очистка сессии (access + refresh). PIN-флаг не трогаем.
export const clearSession = () => {
    deleteToken();
};

export const savePin = () => {
    if (!hasStorage()) return;
    localStorage.setItem('pin_code', 'YES');
};
export const getPin = () => {
    if (!hasStorage()) return null;
    return localStorage.getItem('pin_code');
};

export const decodeToken = (token) => {
    try {
        return jwtDecode(token);
    } catch {
        return null;
    }
};

// Токен ещё действителен (по exp в payload)?
export const isTokenAlive = (token) => {
    const payload = token ? decodeToken(token) : null;
    return Boolean(payload && payload?.exp * 1000 > Date.now());
};
