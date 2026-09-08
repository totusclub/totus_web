import Link from 'next/link';
import styles from './header.module.css';
import Icon from "@/components/icons/Icon";
import Button from "@/components/UI/button";
import SearchForm from "@/components/search/searchForm";
import { useMemo, useState } from "react";
import AuthModal from "@/components/auth";
import useAuth from "@/hooks/useAuth";
import { useRouter } from "next/router";
import { clearSearch } from '@/store/slices/searchSlice';
import { clearSearchListState } from '@/utils/searchListState';
import { useDispatch } from 'react-redux';
import LogoDesktopIcon from "@/components/icons/logoDesktop";
import { FOOTER_STATIC_MOBILE_TITLES } from "@/config/footerStaticPages";
import HeaderProfileMenu from "@/components/header/HeaderProfileMenu";

const Header = () => {
    const dispatch = useDispatch();
    const [authModalOpen, setAuthModalOpen] = useState(false);
    const { token } = useAuth();
    const router = useRouter();
    const pathname = router.pathname || '';

    const showSearch = useMemo(() => {
        if (!pathname) return 'home';
        const segments = pathname.split('/').filter(Boolean);
        return segments[segments.length - 1] || 'home';
    }, [pathname])


    const headerMobileRender = useMemo(() => {
        if (pathname) {
            const segments = pathname.split('/').filter(Boolean);
            const pageName = segments[segments.length - 1] || 'home';
            if (pageName === 'search' || pageName === 'tickets') {
                return <SearchForm pageName={pageName} header={true} />
            } else if (pageName === 'hotel-details') {
                return <p className={styles.pageName}>Отель</p>
            } else if (pageName === 'profile') {
                return <p className={styles.pageName}>Профиль</p>
            } else if (pageName === 'my-orders') {
                return <p className={styles.pageName}>Мои заказы</p>
            } else if (pageName === '[order_id]') {
                return <p className={styles.pageName}>Детали заказа</p>
            } else if (pageName === 'support-chat') {
                return <p className={styles.pageName}>Чат с поддержкой</p>
            } else if (FOOTER_STATIC_MOBILE_TITLES[pageName]) {
                return <p className={styles.pageName}>{FOOTER_STATIC_MOBILE_TITLES[pageName]}</p>
            } else if (pageName === 'favorites') {
                return <p className={styles.pageName}>Избранное</p>
            }
        }

    }, [pathname])

    const showHeader = useMemo(() => {
        if (!pathname) return 'home';
        const segments = pathname.split('/').filter(Boolean);
        return segments[segments.length - 1] || 'home';
    }, [pathname])

    const handleGoBack = () => {
        if (!pathname) {
            router.push('/');
            return;
        }
        const segments = pathname.split('/').filter(Boolean);
        const pageName = segments[segments.length - 1] || 'home';
        if (pageName === 'search') {
            router.push('/');
            dispatch(clearSearch());
            clearSearchListState();
        } else {
            router.back();
        }

    };

    return (
        <>
            <header className={`${styles.header} ${showHeader === 'home' ? styles.hide : ''}`}>
                <div className={styles.headerRow}>
                    <div className={styles.logo}>
                        <Link href="/">
                            {/* Desktop/Tablet Logo */}
                            <div className={styles.logoDesktop}>
                                <LogoDesktopIcon />
                            </div>
                            {/* Mobile Logo - Only show on home page */}
                            {showHeader === 'home' && (
                                <div className={styles.logoMobile}>
                                    <Icon name={"logo"} size={120} color="#000" />
                                </div>
                            )}
                        </Link>
                    </div>
                    <div className={styles.backM}>
                        <div onClick={() => handleGoBack()}>
                            <Icon name={"back"} size={24} color="#000" />
                        </div>
                    </div>
                    {showSearch === 'hotel-details' && (
                        <div className={styles.shareBtn}>
                            <Icon name="share" size={24} color="#000" />
                        </div>
                    )}
                </div>
                {headerMobileRender}


                <div className={`${styles.headerRow} ${styles.headerRowPc}`}>
                    {token ? (
                        <HeaderProfileMenu />
                    ) : (
                        <Button onClick={() => setAuthModalOpen(true)} title={'Войти'} />
                    )}
                </div>
                <div className={styles.headerRowM}>
                </div>
            </header>
            <AuthModal open={authModalOpen} setOpen={setAuthModalOpen} />
        </>
    );
};

export default Header;
