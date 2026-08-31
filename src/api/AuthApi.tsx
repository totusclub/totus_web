import axios from 'axios';
import { API_BASE_URL } from '@/config/api';

const BASE_URL = API_BASE_URL;


export async function SignInRequest(params: any) {
    if (!params) {
        throw new Error('Missing package_id');
    }
    const response = await axios.post(`${BASE_URL}/api/auth/signin`, params);
    return response.data;
}

export async function SignUpRequest(params: any) {
    if (!params) {
        throw new Error('Missing package_id');
    }
    const response = await axios.post(`${BASE_URL}/api/auth/signup`, params);
    return response.data;
}

export async function verifyCodeRequest(params: any) {
    try {
        if (!params) {
            throw new Error('Missing package_id');
        }
        const response = await axios.post(`${BASE_URL}/api/auth/verify`, params);
        return response.data;
    }catch(error) {
        return error;
    }

}

export interface MeProfile {
    id: number;
    name?: string | null;
    f_name?: string | null;
    l_name?: string | null;
    email?: string | null;
    phone?: string | null;
    loyalty_id?: string | null;
    date?: string | null;
    role?: 'user' | 'agent';
}

// Профиль по токену (Bearer подставляет interceptor из '@/api/http').
// Возвращает null, если не авторизован или API недоступен — вызывающий код
// продолжает работать с профилем из payload токена.
export async function getMe(): Promise<MeProfile | null> {
    try {
        const response = await axios.get<{ user: MeProfile }>(`${BASE_URL}/api/auth/me`);
        return response.data?.user ?? null;
    } catch {
        return null;
    }
}
