import axios from 'axios';

const BASE_URL = 'http://213.109.202.180:3001';
// const BASE_URL = 'http://192.168.1.104:3001';


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
    if (!params) {
        throw new Error('Missing package_id');
    }
    const response = await axios.post(`${BASE_URL}/api/auth/verify`, params);
    return response.data;
}
