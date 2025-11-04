import axios from 'axios';

const BASE_URL = 'https://api.totus.club';
// const BASE_URL = 'http://192.168.1.105:3001';


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
