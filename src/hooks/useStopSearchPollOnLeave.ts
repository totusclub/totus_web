import { useEffect } from 'react';
import { useRouter } from 'next/router';
import { stopActiveSearchPoll } from '@/store/slices/searchSlice';

const SEARCH_POLL_ROUTES = ['/search', '/hotel-details'];

function isSearchPollRoute(path: string): boolean {
    const pathname = path.split('?')[0];
    return SEARCH_POLL_ROUTES.some(
        (route) => pathname === route || pathname.startsWith(`${route}/`),
    );
}

/** Stops search-status polling when navigating away from search / hotel-details. */
export function useStopSearchPollOnLeave() {
    const router = useRouter();

    useEffect(() => {
        const handleRouteChange = (url: string) => {
            if (!isSearchPollRoute(url)) {
                stopActiveSearchPoll();
            }
        };

        if (!isSearchPollRoute(router.pathname)) {
            stopActiveSearchPoll();
        }

        router.events.on('routeChangeStart', handleRouteChange);
        return () => {
            router.events.off('routeChangeStart', handleRouteChange);
        };
    }, [router]);
}
