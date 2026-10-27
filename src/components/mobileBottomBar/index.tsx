import styles from './mobileBottomBar.module.css';
import {useMemo, useState} from "react";
import {usePathname} from "next/navigation";
import AuthModal from "@/components/auth/LazyAuthModal";
import useAuth from "@/hooks/useAuth";
import {useRouter} from "next/router";
import {clearSearch} from '@/store/slices/searchSlice';
import {useDispatch, useSelector} from 'react-redux';
import type {RootState} from '@/store';
import TotusIcon from '@/components/icons/totus/TotusIcon';
import {iconTabAccount, iconTabOrders, iconTabSearch} from '@/components/icons/totus/icons.generated';


/*
 * Иконки — набор Totus (стиль C, components/icons/totus). Цвет — currentColor:
 * активная вкладка оранжевая целиком, остальные — цвет текста темы с оранжевой деталью
 * (см. mobileBottomBar.module.css).
 */
const SearchTabIcon = () => <TotusIcon icon={iconTabSearch} size={24} />;
const OrdersTabIcon = () => <TotusIcon icon={iconTabOrders} size={24} />;
const AccountTabIcon = () => <TotusIcon icon={iconTabAccount} size={24} />;

const MobileBottomBar = () => {
    const router = useRouter();
    const dispatch = useDispatch();
    // Кода доступа к сайту больше нет (решение владельца 27.10.2026): сайт открывается сразу.
    const [authModalOpen, setAuthModalOpen] = useState(false);

    const {user,token} = useAuth()
    const supportUnread = useSelector((state: RootState) => state.supportChat?.unreadCount ?? 0);
    const pathname = usePathname();
    const pageName = useMemo(()=>{
        if (!pathname) return 'home';
        const segments = pathname.split('/').filter(Boolean); // removes empty strings
        return segments[segments.length - 1] || 'home';
    },[pathname])


    const handleHome = () => {
        router.push('/')
        dispatch(clearSearch())

    }

    return (
        <>
            <div className={styles.mobileTab}>
                <div onClick={()=>handleHome()} className={`${styles.itemTabNav} ${['home', 'search', 'tickets', 'hotel-details'].includes(pageName) ? styles.itemTabNavActive : ''}`}>
                    <SearchTabIcon/>
                    <span className={styles.tabLabel}>Поиск</span>
                </div>
                <div className={`${styles.itemTabNav} ${['my-orders'].includes(pageName) ? styles.itemTabNavActive : ''}`} onClick={()=>{token? router.push('/profile/my-orders'):setAuthModalOpen(true)}}>
                    <OrdersTabIcon/>
                    <span className={styles.tabLabel}>Заказы</span>
                </div>
                <div className={`${styles.itemTabNav} ${['profile', 'support-chat'].includes(pageName) ? styles.itemTabNavActive : ''}`} onClick={()=>{token? router.push('/profile'):setAuthModalOpen(true)}}>
                    <span className={styles.tabIconWrap}>
                        <AccountTabIcon/>
                        {token && supportUnread > 0 ? <span className={styles.tabBadge} aria-label="Есть непрочитанные сообщения поддержки" /> : null}
                    </span>
                    <span className={styles.tabLabel}>Аккаунт</span>
                </div>
                {/*<div className={styles.itemTabNav}>*/}
                {/*    <Support/>*/}
                {/*</div>*/}
            </div>
            <AuthModal open={authModalOpen} setOpen={setAuthModalOpen}/>
        </>

    );
};

export default MobileBottomBar;
