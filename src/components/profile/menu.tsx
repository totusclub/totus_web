import styles from './profile.module.css'
import Icon from "@/components/icons/Icon";
import useAuth from "@/hooks/useAuth";
import { useDispatch, useSelector } from "react-redux";
import { logout } from "@/store/slices/authSlice";
import { deleteToken } from "@/utils/auth";
import { useRouter } from "next/router";
import { useState } from "react";
import { useTheme } from "@/hooks/useTheme";
import type { ThemeMode } from "@/utils/theme";
import type { RootState } from "@/store";
import { unregisterDevice } from "@/api/notificationsApi";
import { getDeviceId } from "@/lib/webPush";
import { useSupportCall } from "@/components/support/SupportCallProvider";

// Тема оформления: по умолчанию «Системная» — как в настройках устройства
const THEME_OPTIONS: { value: ThemeMode; label: string }[] = [
    { value: 'light', label: 'Светлая' },
    { value: 'dark', label: 'Тёмная' },
    { value: 'system', label: 'Системная' },
];
const THEME_SUBTITLE: Record<ThemeMode, string> = {
    light: 'Светлая',
    dark: 'Тёмная',
    system: 'Как в системе',
};

const ThemeOptionIcon = ({ mode }: { mode: ThemeMode }) => {
    if (mode === 'light') {
        return (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <circle cx="12" cy="12" r="4.2" stroke="currentColor" strokeWidth="1.8" />
                <path d="M12 2.5v2.2M12 19.3v2.2M2.5 12h2.2M19.3 12h2.2M5.3 5.3l1.6 1.6M17.1 17.1l1.6 1.6M5.3 18.7l1.6-1.6M17.1 6.9l1.6-1.6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
            </svg>
        );
    }
    if (mode === 'dark') {
        return (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
            </svg>
        );
    }
    return (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <rect x="3" y="4.5" width="18" height="12" rx="2" stroke="currentColor" strokeWidth="1.8" />
            <path d="M9 20h6M12 16.5V20" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        </svg>
    );
};

const MenuProfile = () => {
    const router = useRouter();
    const dispatch = useDispatch();
    const { user, token } = useAuth()
    const [deleteModal, setDeleteModal] = useState<boolean>(false)
    const { theme, mode, setMode } = useTheme();
    const supportUnread = useSelector((state: RootState) => state.supportChat?.unreadCount ?? 0);
    // Звонок в поддержку: доступен, если calling_api_v2 отдал access === 0 (как в приложении)
    const { available: canCallSupport, call: callSupport } = useSupportCall();
    const notificationsUnread = useSelector((state: RootState) => state.notifications?.unread ?? 0);

    const handleLogout = () => {
        // отвязать этот браузер от push-уведомлений пользователя (до удаления токена; fire-and-forget)
        unregisterDevice({ deviceId: getDeviceId() }).catch(() => undefined);
        deleteToken();
        dispatch(logout());
        router.push('/');
        if (window.ReactNativeWebView && window.ReactNativeWebView.postMessage) {
            window.ReactNativeWebView.postMessage('logout');
        }
    }

    return (
        <div className={styles.profileMenuCol}>
            <div className={styles.profileCard}>
                <div className={styles.profileCardHeader}>
                    <p>Карта лояльности</p>
                    <Icon name={'bird'} size={64} />
                </div>
                <div className={styles.profileCardInfo}>
                    <p className={styles.profileCardNumber}>{user?.loyalty_id}</p>
                    <p className={styles.smallInfoCard}><Icon name={'info'} color={'#fff'} size={18} />Ваш персональный номер</p>
                </div>
                <div className={styles.profileName}>
                    <p>{`${user?.name} ${user?.l_name}`}</p>
                    <div className={styles.userCardIcon}>
                        <Icon name={'user'} size={16} />
                    </div>

                </div>
            </div>
            {/*<div className={styles.profileMenu}>*/}
            {/*    <div className={styles.profileMenuHead}>*/}
            {/*        <p>Личная информация</p>*/}
            {/*    </div>*/}
            {/*    <div className={styles.profileMenuItem}>*/}
            {/*        <Icon name={'card'} size={24}/>*/}
            {/*        <p>Способы оплаты</p>*/}
            {/*    </div>*/}
            {/*    <div className={styles.profileMenuItem}>*/}
            {/*        <Icon name={'faq'} size={24}/>*/}
            {/*        <p>FAQ</p>*/}
            {/*    </div>*/}
            {/*    <div className={styles.profileMenuItem}>*/}
            {/*        <Icon name={'tourist'} size={24}/>*/}
            {/*        <p>Туристы</p>*/}
            {/*    </div>*/}
            {/*</div>*/}
            <div className={styles.profileMenu}>
                {/*<div className={styles.profileMenuHead}>*/}
                {/*    <p>Личная информация</p>*/}
                {/*</div>*/}
                {/*<div className={styles.profileMenuItem}>*/}
                {/*    <Icon name={'profile'} size={24}/>*/}
                {/*    <p>Моя учетная запись</p>*/}
                {/*</div>*/}

                <div onClick={() => router.push('/profile/my-orders')} className={styles.profileMenuItem}>
                    <Icon name={'order'} size={24} />
                    <p>Мои заказы</p>
                </div>
                <div onClick={() => router.push('/profile/favorites')} className={styles.profileMenuItem}>
                    <Icon name={'favorite'} size={24} />
                    <p>Избранное</p>
                </div>
                <div
                    onClick={() => router.push('/profile/notifications')}
                    className={`${styles.profileMenuItem} ${styles.profileMenuItemChat} ${router.pathname.startsWith('/profile/notifications') ? styles.profileMenuItemActive : ''}`}
                >
                    <div className={styles.profileMenuChatIcon}>
                        <Icon name={'notification'} size={24} color={'var(--textPrimary)'} />
                    </div>
                    <div className={styles.profileMenuItemText}>
                        <p>Уведомления</p>
                        <span className={styles.profileMenuItemSub}>Заказы, оплата, напоминания и акции</span>
                    </div>
                    {notificationsUnread > 0 && (
                        <span className={styles.profileMenuCount} aria-label={`Непрочитанных: ${notificationsUnread}`}>
                            {notificationsUnread > 99 ? '99+' : notificationsUnread}
                        </span>
                    )}
                </div>
                <div
                    onClick={() => router.push('/profile/support-chat')}
                    className={`${styles.profileMenuItem} ${styles.profileMenuItemChat} ${router.pathname === '/profile/support-chat' ? styles.profileMenuItemActive : ''}`}
                >
                    <div className={styles.profileMenuChatIcon}>
                        <Icon name={'message'} size={24} color={'var(--textPrimary)'} />
                        {supportUnread > 0 && <span className={styles.profileMenuBadge} aria-label={`Непрочитанных: ${supportUnread}`} />}
                    </div>
                    <div className={styles.profileMenuItemText}>
                        <p>Чат с поддержкой</p>
                        <span className={styles.profileMenuItemSub}>Напишите нам — ответим в чате</span>
                    </div>
                </div>
                {canCallSupport && (
                    <div
                        onClick={callSupport}
                        className={`${styles.profileMenuItem} ${styles.profileMenuItemChat}`}
                        role="button"
                        tabIndex={0}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === ' ') callSupport();
                        }}
                    >
                        <div className={styles.profileMenuChatIcon}>
                            <Icon name={'phone'} size={24} color={'var(--textPrimary)'} />
                        </div>
                        <div className={styles.profileMenuItemText}>
                            <p>Звонок в поддержку</p>
                            <span className={styles.profileMenuItemSub}>Голосовой звонок из браузера</span>
                        </div>
                    </div>
                )}
                <div onClick={() => router.push('/privacy-policy')} className={styles.profileMenuItem}>
                    <Icon name={'faq'} size={24} />
                    <p>Политика обработки персональных данных</p>
                </div>

                {/*<div className={styles.profileMenuItem}>*/}
                {/*    <Icon name={'notification'} size={24} color={'var(--textPrimary)'} />*/}
                {/*    <p>Настройки уведомлений</p>*/}
                {/*</div>*/}
            </div>
            <div className={styles.profileMenu}>
                <div className={styles.themeHead}>
                    <Icon name={theme === 'light' ? 'light' : 'moon'} size={24} />
                    <div className={styles.profileMenuItemText}>
                        <p>Оформление</p>
                        <span className={styles.profileMenuItemSub}>{THEME_SUBTITLE[mode]}</span>
                    </div>
                </div>
                <div className={styles.themeSegment} role="radiogroup" aria-label="Тема оформления">
                    {THEME_OPTIONS.map((option) => {
                        const active = mode === option.value;
                        return (
                            <button
                                key={option.value}
                                type="button"
                                role="radio"
                                aria-checked={active}
                                className={`${styles.themeSegmentBtn} ${active ? styles.themeSegmentActive : ''}`}
                                onClick={() => setMode(option.value)}
                            >
                                <ThemeOptionIcon mode={option.value} />
                                {option.label}
                            </button>
                        );
                    })}
                </div>
            </div>
            {/*<div className={styles.profileMenu}>*/}
            {/*    <div className={styles.profileMenuHead}>*/}
            {/*        <p>Настройки аккаунта</p>*/}
            {/*    </div>*/}
            {/*    <div className={styles.profileMenuItem}>*/}
            {/*        <Icon name={'profile'} size={24}/>*/}
            {/*        <p>Моя учетная запись</p>*/}
            {/*    </div>*/}
            {/*</div>*/}
            <div className={styles.profileMenu}>
                <div onClick={() => handleLogout()} className={styles.profileMenuLogout}>
                    <p>Выйти</p>
                    <Icon name={'logout'} size={24} />
                </div>
            </div>
            {/*<div className={styles.deleteBlock}>*/}
            {/*    <p onClick={() => setDeleteModal(true)}>Удалить аккаунт</p>*/}
            {/*</div>*/}
            {deleteModal && (
                <>
                    <div className={styles.modalDeleteAccountLeyer} onClick={() => setDeleteModal(false)}></div>
                    <div className={styles.modalDeleteAccount}>
                        <div className={styles.modalDeleteAccountHead}>
                            <p>Удаление аккаунта</p>
                        </div>
                        <div className={styles.modalDeleteAccountBody}>
                            <p>Вы действительно хотите удалить аккаунт?</p>
                            <p>Если вы не войдёте в систему в течение 30 дней, аккаунт будет автоматически удалён.</p>
                        </div>
                        <div className={styles.modalDeleteAccountFooter}>
                            <div className={styles.cancelBtn} onClick={() => setDeleteModal(false)}>
                                <p>Отмена</p>
                            </div>
                            <div className={styles.applyBtn} onClick={() => handleLogout()}>
                                <p>Удалить</p>
                            </div>
                        </div>
                    </div>
                </>
            )}

        </div>
    );
};

export default MenuProfile;
