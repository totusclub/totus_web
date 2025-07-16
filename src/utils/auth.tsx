// utils/auth.js
import {jwtDecode} from 'jwt-decode';

export const saveToken = (token) => {
    localStorage.setItem('auth_token', token);
};

export const loadToken = () => {
    return localStorage.getItem('auth_token');
};

export const deleteToken = () => {
    localStorage.removeItem('auth_token');
};

export const decodeToken = (token) => {
    try {
        return jwtDecode(token);
    } catch {
        return null;
    }
};
