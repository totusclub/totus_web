import Link from 'next/link';
import Head from 'next/head';
import styles from './header.module.css';
import Icon from "@/components/icons/Icon";
import Button from "@/components/UI/button";
import SearchForm from "@/components/search/searchForm";
import {usePathname} from "next/navigation";
import {useMemo, useState} from "react";
import AuthModal from "@/components/auth";
import useAuth from "@/hooks/useAuth";
// import {router} from "next/client";
import HotelDetails from "@/pages/hotel-details";
import {useRouter} from "next/router";
import {clearSearch} from '@/store/slices/searchSlice';
import {useDispatch} from 'react-redux';

const Header = () => {
    const dispatch = useDispatch();
    const [authModalOpen, setAuthModalOpen] = useState(false);
    const {user,token} = useAuth()
    const pathname = usePathname();
    const router = useRouter();

    const showSearch = useMemo(()=>{
        const segments = pathname.split('/').filter(Boolean); // removes empty strings
        return segments[segments.length - 1] || 'home';
    },[pathname])


    const headerMobileRender = useMemo(() => {
        if(pathname){
            const segments = pathname.split('/').filter(Boolean); // removes empty strings
            const pageName =  segments[segments.length - 1] || 'home';
            if(pageName === 'search' || pageName === 'tickets'){
                return <SearchForm pageName={pageName} header={true}/>
            }else if(pageName === 'hotel-details'){
                return <p className={styles.pageName}>Отель</p>
            }else if(pageName === 'profile'){
                return <p className={styles.pageName}>Профиль</p>
            }else if(pageName === 'my-orders'){
                return <p className={styles.pageName}>Мои заказы</p>
            }else if(pageName === 'privacy-policy'){
                return <p className={styles.pageName}>Политика конфиденциальности</p>
            }
        }

    },[pathname])

    const showHeader = useMemo(()=>{
        const segments = pathname.split('/').filter(Boolean); // removes empty strings
        return segments[segments.length - 1] || 'home';
    },[pathname])

    const handleGoBack = () => {
        const segments = pathname.split('/').filter(Boolean); // removes empty strings
        const pageName =  segments[segments.length - 1] || 'home';
        if(pageName === 'search'){
            // dispatch(clearSearch())
            router.push('/');
            dispatch(clearSearch())
        }else{
            router.back();
        }

    };

    return (
        <>
            <Head>
                <title>Арлекино тур</title>
                <meta
                    name="viewport"
                    content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no"
                />
                <meta name="description" content="Лучшие туры с Арлекино тур – незабываемые путешествия и отдых."/>
            </Head>
            <header className={`${styles.header} ${showHeader === 'home' ? styles.hide : ''}`}>
                <div className={styles.headerRow}>
                    <div className={styles.logo}>
                        <Link href="/">
                            <Icon name={"logo"} size={200} color="#000"/>
                        </Link>
                    </div>
                    <div className={styles.backM}>
                        <div onClick={()=>handleGoBack()}>
                            <Icon name={"back"} size={24} color="#000"/>
                        </div>
                    </div>
                    {showSearch ==='hotel-details' && (
                        <div className={styles.shareBtn}>
                            <Icon name="share" size={24} color="#000"/>
                        </div>
                    )}
                </div>
                {/*<h1>{showSearch}</h1>*/}
                {/*/!*{showSearch && (*!/*/}
                {/*/!*    <SearchForm header={true}/>*!/*/}
                {/*/!*)}*!/*/}
                {headerMobileRender}


                <div className={`${styles.headerRow} ${styles.headerRowPc}`}>
                <div className={styles.favorite}>
                        <Icon name="heart" size={24} color="#000"/>
                    </div>
                    {token ? (
                        <div onClick={()=>router.push('/profile')} className={styles.profileButton}>
                           <p>{user.name} {user.l_name}</p>
                        </div>
                    ):(
                        <Button onClick={()=>setAuthModalOpen(true)} title={'Войти'}/>
                    ) }
                </div>
                <div className={styles.headerRowM}>
                    {/*{token ? (*/}
                    {/*    <div onClick={()=>router.push('/profile')} className={styles.profileButton}>*/}
                    {/*        <p>{user.name} {user.l_name}</p>*/}
                    {/*    </div>*/}
                    {/*):(*/}
                    {/*    <Button onClick={()=>setAuthModalOpen(true)} title={'Войти'}/>*/}
                    {/*) }*/}

                </div>
            </header>
            <AuthModal open={authModalOpen} setOpen={setAuthModalOpen} />
        </>
    );
};

export default Header;
