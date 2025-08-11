
import type { AppProps } from 'next/app';
import { useEffect, useState } from 'react';
import { wrapper } from '../store';
import '../styles/globals.css';
import Header from '@/components/header';
import Footer from '@/components/footer';
import {decodeToken, loadToken} from "@/utils/auth";
import {setAuth} from "@/store/slices/authSlice";
import {useDispatch} from "react-redux";
import MobileBottomBar from "@/components/mobileBottomBar";

function getCookie(name: string): string | null {
    const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
    return match ? decodeURIComponent(match[2]) : null;
}
function setCookie(name: string, value: string, days: number) {
    const expires = new Date(Date.now() + days * 864e5).toUTCString();
    document.cookie = `${name}=${encodeURIComponent(value)}; expires=${expires}; path=/`;
}

function MyApp({ Component, pageProps }: AppProps) {
    const [loggedIn, setLoggedIn] = useState(false);
    const dispatch = useDispatch();

    useEffect(() => {
        // const loggedUser = getCookie('loggedInUser');
        // if (loggedUser) {
        //     setLoggedIn(true);
        // } else {
        //     const correctLogin = 'admin';
        //     const correctPassword = '0wI?394ICMbq';
        //     const login = prompt('Enter your login:');
        //     const password = prompt('Enter your password:');
        //     if (login === correctLogin && password === correctPassword) {
        //         alert(`Login successful! Welcome, ${login}`);
        //         setCookie('loggedInUser', login, 7);
        //         setLoggedIn(true);
        //     } else {
        //         alert('Incorrect login or password. The page will reload.');
        //         window.location.reload();
        //     }
        // }
        const token = loadToken();
        if (token) {
            const user = decodeToken(token);
            if (user && user?.exp * 1000 > Date.now()) {
                dispatch(setAuth({ token, user }));
            }
        }
    }, []);

    // if (!loggedIn) {
    //     return null;
    // }


    return (
        <div id="root">
            <Header />
            <Component {...pageProps} />
            <Footer />
            <MobileBottomBar />
        </div>
    );
}

export default wrapper.withRedux(MyApp);
