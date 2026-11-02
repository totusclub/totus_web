import { useRef, type ReactNode } from 'react';
import { useSelector } from 'react-redux';
import type { RootState } from '@/store';

/**
 * Монтирует детей только после того, как в этой вкладке появился вход (token в Redux),
 * и дальше уже не размонтирует — выход обрабатывают сами компоненты (сброс, отключение сокета).
 * Гостям код чата, уведомлений и Маши не загружается вовсе.
 */
export default function AuthOnly({ children }: { children: ReactNode }) {
    const token = useSelector((state: RootState) => (state as any).auth?.token);
    const seenRef = useRef(false);
    if (token) seenRef.current = true;
    if (!seenRef.current) return null;
    return <>{children}</>;
}
