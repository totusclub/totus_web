// pages/_app.tsx
import type { AppProps } from 'next/app';
import { useEffect, useState } from 'react';
import { wrapper } from '../store';
import '../styles/globals.css';
import Header from '@/components/header';
import Footer from '@/components/footer';

// Helper: read cookie by name (client-side)
function getCookie(name: string): string | null {
    const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
    return match ? decodeURIComponent(match[2]) : null;
}

// Helper: set cookie
function setCookie(name: string, value: string, days: number) {
    const expires = new Date(Date.now() + days * 864e5).toUTCString();
    document.cookie = `${name}=${encodeURIComponent(value)}; expires=${expires}; path=/`;
}

function MyApp({ Component, pageProps }: AppProps) {
    const [loggedIn, setLoggedIn] = useState(false);

    useEffect(() => {
        const loggedUser = getCookie('loggedInUser');
        if (loggedUser) {
            // If cookie exists, user is logged in
            setLoggedIn(true);
            console.log(`Welcome back, ${loggedUser}!`);
        } else {
            // No cookie, prompt login
            const correctLogin = 'admin';
            const correctPassword = '0wI?394ICMbq';

            const login = prompt('Enter your login:');
            const password = prompt('Enter your password:');

            if (login === correctLogin && password === correctPassword) {
                alert(`Login successful! Welcome, ${login}`);
                setCookie('loggedInUser', login, 7); // cookie for 7 days
                setLoggedIn(true);
            } else {
                alert('Incorrect login or password. The page will reload.');
                window.location.reload(); // reload to try again
            }
        }
    }, []);

    if (!loggedIn) {
        return null; // or show a loading spinner/message
    }

    return (
        <div id="root">
            <Header />
            <Component {...pageProps} />
            <Footer />
        </div>
    );
}

export default wrapper.withRedux(MyApp);
