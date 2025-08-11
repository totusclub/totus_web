// hoc/withAuth.js
import { useRouter } from 'next/router';
import { useEffect } from 'react';
import useAuth from '@/hooks/useAuth';

const withAuth = (WrappedComponent) => {
    return function ProtectedRoute(props) {
        const { user } = useAuth();
        const router = useRouter();

        useEffect(() => {
            console.log('user',user)
            if (!user) {
                router.replace('/');
            }
        }, [user]);

        if (!user) return null; // Optional loading state

        return <WrappedComponent {...props} />;
    };
};

export default withAuth;
