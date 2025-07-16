// hooks/useAuth.js
import { useSelector, useDispatch } from 'react-redux';
import { useEffect } from 'react';
import { loadToken, decodeToken } from '@/utils/auth';
import {setAuth} from "@/store/slices/authSlice";

export default function useAuth() {
    const dispatch = useDispatch();
    const auth = useSelector((state) => state.auth);

    useEffect(() => {
        // If no user in Redux but token exists in localStorage, restore auth
        if (!auth.user && typeof window !== 'undefined') {
            const token = loadToken();
            if (token) {
                const user = decodeToken(token);
                if (user && user.exp * 1000 > Date.now()) {
                    dispatch(setAuth({ token, user }));
                }
            }
        }
    }, [auth?.user, dispatch]);

    return auth;
}
