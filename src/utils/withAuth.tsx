// hoc/withAuth.js
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import useAuth from '@/hooks/useAuth';
import { loadToken, decodeToken } from '@/utils/auth';

const withAuth = (WrappedComponent) => {
    return function ProtectedRoute(props) {
        const { user, token } = useAuth();
        const router = useRouter();
        const [hasCheckedAuth, setHasCheckedAuth] = useState(false);

        useEffect(() => {
            // Check if there's a valid token in localStorage
            // This prevents redirecting before auth state is restored from localStorage
            if (typeof window !== 'undefined') {
                const storedToken = loadToken();
                if (storedToken) {
                    const decodedUser = decodeToken(storedToken);
                    // If token exists and is valid, wait for useAuth to restore it
                    if (decodedUser && decodedUser.exp * 1000 > Date.now()) {
                        // Wait for useAuth's useEffect to run and restore the user
                        // Give it a moment to restore from localStorage
                        const timer = setTimeout(() => {
                            setHasCheckedAuth(true);
                        }, 300);
                        return () => clearTimeout(timer);
                    }
                }
                // No token or invalid token, we can check immediately
                setHasCheckedAuth(true);
            } else {
                setHasCheckedAuth(true);
            }
        }, []);

        useEffect(() => {
            // Only redirect if we've finished checking auth and there's no user or token
            if (hasCheckedAuth && !user && !token) {
                router.replace('/');
            }
        }, [user, token, hasCheckedAuth, router]);

        // Show loading state while checking auth
        if (!hasCheckedAuth) {
            return null;
        }

        // If no user after checking, return null (redirect will happen)
        if (!user && !token) {
            return null;
        }

        return <WrappedComponent {...props} />;
    };
};

export default withAuth;
