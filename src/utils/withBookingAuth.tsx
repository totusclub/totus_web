// Бронирование только для вошедших: /booking и /checkout.
// Гость остаётся на том же URL (параметры тура сохраняются), ему сразу открывается окно входа/регистрации
// (событие AUTH_OPEN_EVENT ловит Header, в котором живёт AuthModal) и показывается подсказка с кнопкой.
// Как только токен появился (после подтверждения кода в verification.tsx) — страница бронирования
// рендерится на месте, без перехода: пользователь продолжает оформление выбранного тура.
import { useEffect, useState } from 'react';
import useAuth from '@/hooks/useAuth';
import { loadToken, isTokenAlive } from '@/utils/auth';
import Button from '@/components/UI/button';

export const AUTH_OPEN_EVENT = 'totus:auth-open';
// Если Header ещё не подписался (порядок эффектов при первом рендере) — флаг, который он проверит при монтировании.
const PENDING_FLAG = '__totusAuthOpenPending';

export function openAuthModal() {
    if (typeof window === 'undefined') return;
    (window as any)[PENDING_FLAG] = true;
    window.dispatchEvent(new Event(AUTH_OPEN_EVENT));
}

/** Для Header: подписаться на запрос открытия окна входа; возвращает функцию отписки. */
export function subscribeAuthOpen(open: () => void): () => void {
    const handler = () => {
        (window as any)[PENDING_FLAG] = false;
        open();
    };
    window.addEventListener(AUTH_OPEN_EVENT, handler);
    if ((window as any)[PENDING_FLAG]) handler();
    return () => window.removeEventListener(AUTH_OPEN_EVENT, handler);
}

function hasLiveStoredToken(): boolean {
    if (typeof window === 'undefined') return false;
    try {
        const stored = loadToken();
        return Boolean(stored && isTokenAlive(stored));
    } catch {
        return false;
    }
}

const withBookingAuth = (WrappedComponent) => {
    return function BookingAuthGate(props) {
        const { token } = useAuth();
        const [checked, setChecked] = useState(false);
        const [storedAlive, setStoredAlive] = useState(false);

        useEffect(() => {
            // Токен в localStorage восстанавливается в redux из _app.tsx чуть позже первого рендера —
            // смотрим в хранилище напрямую, чтобы не мигать подсказкой у вошедшего пользователя.
            // Повторно — при смене токена (вход на этой странице / выход).
            const alive = Boolean(token) || hasLiveStoredToken();
            setStoredAlive(alive);
            setChecked(true);
            if (!alive) openAuthModal();
        }, [token]);

        if (!checked) return null;
        if (token || storedAlive) return <WrappedComponent {...props} />;

        return (
            <div className="content">
                <div style={{ minHeight: '60vh', display: 'flex', justifyContent: 'center' }}>
                    <div style={{ width: '380px' }}>
                        <p style={{ textAlign: 'center', marginTop: '15vh', fontSize: 24 }}>Чтобы оформить бронирование, войдите или зарегистрируйтесь</p>
                        <p style={{ textAlign: 'center', marginTop: 4, fontSize: 16, marginBottom: 30 }}>После входа вы вернётесь к выбранному туру и продолжите оформление</p>
                        <Button title={'Войти или зарегистрироваться'} onClick={openAuthModal} />
                    </div>
                </div>
            </div>
        );
    };
};

export default withBookingAuth;
