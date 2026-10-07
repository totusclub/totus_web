import Link from 'next/link';
import styles from './header.module.css';
import Icon from "@/components/icons/Icon";
import Button from "@/components/UI/button";
import dynamic from "next/dynamic";
import { useMemo, useState } from "react";
import AuthModal from "@/components/auth/LazyAuthModal";
import useAuth from "@/hooks/useAuth";
import { useRouter } from "next/router";
import { clearSearch } from '@/store/slices/searchSlice';
import { clearSearchListState } from '@/utils/searchListState';
import { useDispatch } from 'react-redux';
import LogoDesktopIcon from "@/components/icons/logoDesktop";
import { FOOTER_STATIC_MOBILE_TITLES } from "@/config/footerStaticPages";
import HeaderProfileMenu from "@/components/header/HeaderProfileMenu";
import NotificationsBell from "@/components/notifications/NotificationsBell";
import { useHomeHeroTitle } from "@/hooks/useHomeHeroTitle";

const DEFAULT_HERO_TITLE = 'Путешествия начинаются здесь';

// Форма поиска в шапке нужна только на /search и /tickets — отдельный чанк (с SSR), а не общий бандл.
const SearchForm = dynamic(() => import("@/components/search/searchForm"));

/** heroTitle — заголовок hero главной с сервера (pageProps.homeHero), чтобы он был в HTML сразу. */
const Header = ({ heroTitle: ssrHeroTitle = null }: { heroTitle?: string | null }) => {
    const dispatch = useDispatch();
    const [authModalOpen, setAuthModalOpen] = useState(false);
    const { token } = useAuth();
    const router = useRouter();
    const pathname = router.pathname || '';
    // Заголовок hero главной: на Desktop показывается в Header (в мобильной версии — в hero-блоке)
    const isHomePage = pathname === '/';
    const heroTitle = useHomeHeroTitle() ?? ssrHeroTitle;

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
            } else if (pathname === '/profile/notifications') {
                return <p className={styles.pageName}>Уведомления</p>
            } else if (pathname === '/profile/notifications/settings') {
                return <p className={styles.pageName}>Настройки уведомлений</p>
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
                        <Link href="/" aria-label="Totus Club — на главную">
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
                {isHomePage && (
                    <h1
                        className={styles.heroTitle}
                        style={heroTitle === null ? { visibility: 'hidden' } : undefined}
                    >
                        {heroTitle ?? DEFAULT_HERO_TITLE}
                    </h1>
                )}
                {headerMobileRender}


                <div className={`${styles.headerRow} ${styles.headerRowPc}`}>
                    {token ? (
                        <>
                            <NotificationsBell />
                            <HeaderProfileMenu />
                        </>
                    ) : (
                        <Button onClick={() => setAuthModalOpen(true)} title={'Войти'} />
                    )}
                </div>
                <div className={styles.headerRowM}>
                    {token && showSearch !== 'hotel-details' ? <NotificationsBell variant="link" /> : null}
                </div>
            </header>
            <AuthModal open={authModalOpen} setOpen={setAuthModalOpen} />
        </>
    );
};

export default Header;
