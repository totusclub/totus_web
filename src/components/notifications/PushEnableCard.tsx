import { useCallback, useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import type { RootState } from '@/store';
import { fetchSettings, setPushStatus } from '@/store/slices/notificationsSlice';
import { getDeviceName, getWebPushStatus, subscribeWebPush, unsubscribeWebPush, WebPushError } from '@/lib/webPush';
import type { AppDispatch } from '@/store';
import styles from './notifications.module.css';
import TotusIcon from '@/components/icons/totus/TotusIcon';
import { iconCheck } from '@/components/icons/totus/icons.generated';

export const IOS_PWA_HINT = 'Добавьте сайт на экран «Домой», чтобы получать уведомления';

/** Состояние Web Push из Redux + действия «Включить» / «Отключить» (только по клику пользователя). */
export function usePushControls() {
    const dispatch = useDispatch<AppDispatch>();
    const push = useSelector((state: RootState) => state.notifications.push);

    const refresh = useCallback(async () => {
        const status = await getWebPushStatus();
        dispatch(setPushStatus({ ...status, error: null }));
    }, [dispatch]);

    useEffect(() => {
        refresh().catch(() => undefined);
    }, [refresh]);

    const enable = useCallback(async () => {
        dispatch(setPushStatus({ busy: true, error: null }));
        try {
            const status = await subscribeWebPush();
            dispatch(setPushStatus({ ...status, busy: false, error: null }));
            dispatch(fetchSettings());
            return true;
        } catch (error) {
            const message =
                error instanceof WebPushError ? (error as WebPushError).message : 'Не удалось включить уведомления';
            const status = await getWebPushStatus().catch(() => null);
            dispatch(setPushStatus({ ...(status || {}), busy: false, error: message }));
            return false;
        }
    }, [dispatch]);

    const disable = useCallback(async () => {
        dispatch(setPushStatus({ busy: true, error: null }));
        try {
            const status = await unsubscribeWebPush();
            dispatch(setPushStatus({ ...status, busy: false, error: null }));
            dispatch(fetchSettings());
            return true;
        } catch {
            dispatch(setPushStatus({ busy: false, error: 'Не удалось отключить уведомления' }));
            return false;
        }
    }, [dispatch]);

    const enabled = push.supported && push.permission === 'granted' && push.subscribed;

    return { push, enabled, enable, disable, refresh, deviceName: getDeviceName() };
}

function BellOffGlyph() {
    return (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <path d="M6 16V11a6 6 0 0 1 12 0v5l1.5 2h-15L6 16Z" />
            <path d="M10 20a2 2 0 0 0 4 0" />
            <path d="M4 4l16 16" />
        </svg>
    );
}

function CheckGlyph() {
    return (
        <TotusIcon icon={iconCheck} size={22} accent={false} />
    );
}

interface PushEnableCardProps {
    /** Показывать карточку и в состоянии «включены» (страница настроек) — с кнопкой «Отключить» */
    showWhenEnabled?: boolean;
}

/**
 * Карточка «Push-уведомления выключены → Включить» (пустое состояние / настройки).
 * Подписка только по нажатию кнопки — автоматически ничего не запрашивается.
 */
export default function PushEnableCard({ showWhenEnabled = false }: PushEnableCardProps) {
    const { push, enabled, enable, disable, deviceName } = usePushControls();
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted) return null;
    if (enabled && !showWhenEnabled) return null;

    let title = 'Push-уведомления выключены';
    let subtitle = 'Сообщим об оплате, документах и напомним о вылете';
    let hint: string | null = push.error;
    let canEnable = true;

    if (enabled) {
        title = 'Push-уведомления включены';
        subtitle = `${deviceName} · этот браузер`;
    } else if (push.needsPwa) {
        subtitle = IOS_PWA_HINT;
        canEnable = false;
    } else if (!push.supported) {
        subtitle = 'Ваш браузер не поддерживает push-уведомления';
        canEnable = false;
    } else if (push.permission === 'denied') {
        subtitle = 'Уведомления запрещены в настройках браузера';
        hint = hint || 'Разрешите уведомления для totus.club в настройках сайта и нажмите «Включить»';
    } else if (push.permission === 'granted' && !push.subscribed) {
        subtitle = 'Разрешение есть, подписка не оформлена';
    }

    return (
        <div className={styles.pushCard}>
            <span className={`${styles.pushCardIcon} ${enabled ? styles.pushCardIconOn : ''}`}>
                {enabled ? <CheckGlyph /> : <BellOffGlyph />}
            </span>
            <div className={styles.pushCardText}>
                <p className={styles.pushCardTitle}>{title}</p>
                <p className={styles.pushCardSub}>{subtitle}</p>
                {hint ? <p className={styles.pushHint}>{hint}</p> : null}
            </div>
            {enabled ? (
                <button
                    type="button"
                    className={`${styles.pushBtn} ${styles.pushBtnSecondary}`}
                    onClick={() => disable()}
                    disabled={push.busy}
                >
                    {push.busy ? 'Отключаем…' : 'Отключить'}
                </button>
            ) : canEnable ? (
                <button type="button" className={styles.pushBtn} onClick={() => enable()} disabled={push.busy}>
                    {push.busy ? 'Включаем…' : 'Включить'}
                </button>
            ) : null}
        </div>
    );
}
