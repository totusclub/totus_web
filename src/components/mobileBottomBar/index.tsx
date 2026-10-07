import styles from './mobileBottomBar.module.css';
import Icon from "@/components/icons/Icon";
import {useEffect, useMemo, useState} from "react";
import {usePathname} from "next/navigation";
import Link from "next/link";
import AuthModal from "@/components/auth";
import useAuth from "@/hooks/useAuth";
import {useRouter} from "next/router";
import Support from "@/components/support";
import ModalPin from "@/components/UI/modalPin";
import {getPin} from "@/utils/auth";
import {clearSearch} from '@/store/slices/searchSlice';
import {useDispatch, useSelector} from 'react-redux';
import type {RootState} from '@/store';


const MobileBottomBar = () => {
    const router = useRouter();
    const dispatch = useDispatch();
    // Код доступа 2103 при первом открытии сайта (возвращён по решению владельца 07.10.2026;
    // после верного кода браузер помнит его — localStorage pin_code = YES).
    const [pinModalOpen, setPinModalOpen] = useState(true);
    const [authModalOpen, setAuthModalOpen] = useState(false);

    const {user,token} = useAuth()
    const supportUnread = useSelector((state: RootState) => state.supportChat?.unreadCount ?? 0);
    const pathname = usePathname();
    const pageName = useMemo(()=>{
        if (!pathname) return 'home';
        const segments = pathname.split('/').filter(Boolean); // removes empty strings
        return segments[segments.length - 1] || 'home';
    },[pathname])


    useEffect(()=>{
        const checkPin = getPin()
        if(checkPin === 'YES'){
            setPinModalOpen(false);
        }else{
            setPinModalOpen(true);
        }
    },[])

    const handleHome = () => {
        router.push('/')
        dispatch(clearSearch())

    }

    return (
        <>
            <div className={styles.mobileTab}>
                <div onClick={()=>handleHome()} className={styles.itemTabNav}>
                    <Icon name={'search'} color={['home', 'search', 'tickets', 'hotel-details'].includes(pageName) ? 'var(--core_Orange)' : 'var(--textPrimary)'} size={28}/>
                </div>
                <div className={styles.itemTabNav} onClick={()=>{token? router.push('/profile/my-orders'):setAuthModalOpen(true)}}>
                    <Icon color={['my-orders'].includes(pageName) ? 'var(--core_Orange)' : 'var(--textPrimary)'} name={'order'} size={28}/>
                </div>
                <div className={styles.itemTabNav} onClick={()=>{token? router.push('/profile'):setAuthModalOpen(true)}}>
                    <span className={styles.tabIconWrap}>
                        <Icon color={['profile', 'support-chat'].includes(pageName) ? 'var(--core_Orange)' : 'var(--textPrimary)'} name={'user'} size={28}/>
                        {token && supportUnread > 0 ? <span className={styles.tabBadge} aria-label="Есть непрочитанные сообщения поддержки" /> : null}
                    </span>
                </div>
                {/*<div className={styles.itemTabNav}>*/}
                {/*    <Support/>*/}
                {/*</div>*/}
            </div>
            <AuthModal open={authModalOpen} setOpen={setAuthModalOpen}/>
            <ModalPin open={pinModalOpen} setOpen={setPinModalOpen}/>
        </>

    );
};

export default MobileBottomBar;
