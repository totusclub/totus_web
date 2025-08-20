import styles from './profile.module.css'
import Icon from "@/components/icons/Icon";
import useAuth from "@/hooks/useAuth";
import {useDispatch} from "react-redux";
import {logout} from "@/store/slices/authSlice";
import {deleteToken} from "@/utils/auth";
import {router} from "next/client";
import {useState} from "react";

const MenuProfile = () => {
    const dispatch = useDispatch();
    const {user,token} = useAuth()
    const [deleteModal, setDeleteModal] = useState<boolean>(false)

    const handleLogout = () => {
        deleteToken();
        dispatch(logout());
        router.push('/');
    }
    return (
        <div className={styles.profileMenuCol}>
            <div className={styles.profileCard}>
                <div className={styles.profilePicture}>
                    <p>{user?.name?.[0]}{user?.l_name?.[0]}</p>
                </div>
                <div className={styles.profileName}>
                    <p>{user?.name}</p>
                    <p>{user?.l_name}</p>
                    {/*<p className={styles.editProfile}>Изменить профиль</p>*/}
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
                <div onClick={()=>router.push('profile/my-orders')} className={styles.profileMenuItem}>
                    <Icon name={'order'} size={24}/>
                    <p>Мои заказы</p>
                </div>
                {/*<div className={styles.profileMenuItem}>*/}
                {/*    <Icon name={'favorite'} size={24}/>*/}
                {/*    <p>Избранное</p>*/}
                {/*</div>*/}
                <div onClick={()=>router.push('privacy-policy')}  className={styles.profileMenuItem}>
                    <Icon name={'faq'} size={24}/>
                    <p>Политика конфиденциальности</p>
                </div>

                {/*<div className={styles.profileMenuItem}>*/}
                {/*    <Icon name={'notification'} size={24} color={'var(--textPrimary)'} />*/}
                {/*    <p>Настройки уведомлений</p>*/}
                {/*</div>*/}
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
                <div onClick={()=>handleLogout()} className={styles.profileMenuLogout}>
                    <p>Выйти</p>
                    <Icon name={'logout'} size={24}/>
                </div>
            </div>
            <div className={styles.deleteBlock}>
                <p onClick={()=>setDeleteModal(true)}>Удалить аккаунт</p>
            </div>
            {deleteModal && (
                <>
                    <div className={styles.modalDeleteAccountLeyer} onClick={()=>setDeleteModal(false)}></div>
                    <div className={styles.modalDeleteAccount}>
                        <div className={styles.modalDeleteAccountHead}>
                            <p>Удаление аккаунта</p>
                        </div>
                        <div className={styles.modalDeleteAccountBody}>
                            <p>Вы действительно хотите удалить аккаунт?</p>
                            <p>Если вы не войдёте в систему в течение 30 дней, аккаунт будет автоматически удалён.</p>
                        </div>
                        <div className={styles.modalDeleteAccountFooter}>
                            <div className={styles.cancelBtn} onClick={()=>setDeleteModal(false)}>
                                <p>Отмена</p>
                            </div>
                            <div className={styles.applyBtn} onClick={()=>handleLogout()}>
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
