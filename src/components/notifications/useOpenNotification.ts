import { useCallback } from 'react';
import { useRouter } from 'next/router';
import { useDispatch } from 'react-redux';
import type { NotificationData } from '@/api/notificationsApi';
import { isExternalPath, notificationRouteToPath } from '@/lib/webPush';
import { markNotificationOpened } from '@/store/slices/notificationsSlice';
import type { AppDispatch } from '@/store';

/**
 * Тап по уведомлению (список, поповер, тост, клик по системному пушу):
 * POST /api/notifications/opened + переход по data.route.
 */
export function useOpenNotification() {
    const router = useRouter();
    const dispatch = useDispatch<AppDispatch>();

    return useCallback(
        (id: number | null | undefined, data: NotificationData | Record<string, unknown> | null | undefined) => {
            if (typeof id === 'number' && Number.isFinite(id)) {
                dispatch(markNotificationOpened(id)).catch(() => undefined);
            }
            const path = notificationRouteToPath((data || null) as Record<string, unknown> | null);
            if (isExternalPath(path)) {
                window.location.assign(path);
                return;
            }
            router.push(path);
        },
        [dispatch, router],
    );
}
