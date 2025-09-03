import styles from './mobileBottomBar.module.css';
import Icon from "@/components/icons/Icon";
import {useMemo, useState} from "react";
import {usePathname} from "next/navigation";
import Link from "next/link";
import AuthModal from "@/components/auth";
import useAuth from "@/hooks/useAuth";
import {useRouter} from "next/router";
import Support from "@/components/support";


const MobileBottomBar = () => {
    const router = useRouter();
    const [authModalOpen, setAuthModalOpen] = useState(false);
    const {user,token} = useAuth()
    const pathname = usePathname();
    const pageName = useMemo(()=>{
        const segments = pathname.split('/').filter(Boolean); // removes empty strings
        return segments[segments.length - 1] || 'home';
    },[pathname])

    return (
        <>
            <div className={styles.mobileTab}>
                <Link href={'/'} className={styles.itemTabNav}>
                    <Icon name={'search'}
                          color={['home', 'search', 'tickets', 'hotel-details'].includes(pageName) ? '#fe732e' : "#000"}
                          size={28}/>
                </Link>
                <div className={styles.itemTabNav} onClick={()=>{token? router.push('/profile/my-orders'):setAuthModalOpen(true)}}>
                    <Icon color={['my-orders'].includes(pageName) ? '#fe732e' : "#000"} name={'order'} size={28}/>
                </div>
                <div className={styles.itemTabNav} onClick={()=>{token? router.push('/profile'):setAuthModalOpen(true)}}>
                    <Icon color={['profile'].includes(pageName) ? '#fe732e' : "#000"} name={'user'} size={28}/>
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
