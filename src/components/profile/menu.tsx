import styles from './profile.module.css'
import Icon from "@/components/icons/Icon";
import useAuth from "@/hooks/useAuth";
import { useDispatch } from "react-redux";
import { logout } from "@/store/slices/authSlice";
import { deleteToken } from "@/utils/auth";
import { useRouter } from "next/router";
import { useState } from "react";
import SwitchToggle from "@/components/UI/switch";
import { useTheme } from "@/hooks/useTheme";

const MenuProfile = () => {
    const router = useRouter();
    const dispatch = useDispatch();
    const { user, token } = useAuth()
    const [deleteModal, setDeleteModal] = useState<boolean>(false)
    const { theme, toggleTheme } = useTheme();

    const handleLogout = () => {
        deleteToken();
        dispatch(logout());
        router.push('/');
        if (window.ReactNativeWebView && window.ReactNativeWebView.postMessage) {
            window.ReactNativeWebView.postMessage('logout');
        }
    }

    const handelCall = () => {
        if (window.ReactNativeWebView && window.ReactNativeWebView.postMessage) {
            window.ReactNativeWebView.postMessage("openModal")
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
            {/*<div onClick={() => handelCall()} className={styles.profileSupport}>*/}
            {/*    <div className={styles.profileSupport}>*/}
            {/*        <div style={{ position: 'relative' }}>*/}
            {/*            <div className={styles.indicatorSupport} />*/}
            {/*            <Icon name={'support'} size={24} />*/}
            {/*        </div>*/}
            {/*        <p>Звонок в поддержку </p>*/}
            {/*    </div>*/}
            {/*    <Icon name={'phone'} size={18} />*/}
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
                <div onClick={() => router.push('/privacy-policy')} className={styles.profileMenuItem}>
                    <Icon name={'faq'} size={24} />
                    <p>Политика конфиденциальности</p>
                </div>

                {/*<div className={styles.profileMenuItem}>*/}
                {/*    <Icon name={'notification'} size={24} color={'var(--textPrimary)'} />*/}
                {/*    <p>Настройки уведомлений</p>*/}
                {/*</div>*/}
            </div>
            <div className={styles.profileMenu}>
                <div className={styles.profileMenuItem} style={{ justifyContent: 'space-between', cursor: 'pointer', width: '100%' }} onClick={toggleTheme}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Icon name={theme === 'light' ? 'light' : 'moon'} size={24} />
                        <p style={{ color: 'var(--textPrimary)' }}>Темная тема</p>
                    </div>
                    <div onClick={(e) => e.stopPropagation()}>
                        <SwitchToggle isOn={theme === 'dark'} setIsOn={(value) => {
                            if (value !== (theme === 'dark')) {
                                toggleTheme();
                            }
                        }} />
                    </div>
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
