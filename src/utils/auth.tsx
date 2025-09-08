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
export const savePin = () => {
    localStorage.setItem('pin_code', 'YES');
};
export const getPin = () => {
   return  localStorage.getItem('pin_code');
};

export const decodeToken = (token) => {
    try {
        return jwtDecode(token);
    } catch {
        return null;
    }
};
