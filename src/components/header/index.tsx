import Link from 'next/link';
import Head from 'next/head';
import styles from './header.module.css';
import Icon from "@/components/icons/Icon";
import Button from "@/components/UI/button";
import SearchForm from "@/components/search/searchForm";
import {usePathname} from "next/navigation";
import {useMemo, useState} from "react";
import TourModel from "@/components/modals/tourModal";
import AuthModal from "@/components/auth";
import useAuth from "@/hooks/useAuth";
import {router} from "next/client";

const Header = () => {
    const [authModalOpen, setAuthModalOpen] = useState(false);
    const {user,token} = useAuth()
    const pathname = usePathname();

    const showSearch = useMemo(()=>{
        const segments = pathname.split('/').filter(Boolean); // removes empty strings
        const pageName = segments[segments.length - 1] || 'home';
        return pageName === 'search';
    },[pathname])
    return (
        <>
            <Head>
                <title>Арлекино тур</title>
                <meta name="description" content="Лучшие туры с Арлекино тур – незабываемые путешествия и отдых." />
            </Head>
            <header className={styles.header}>
                <div className={styles.headerRow}>
                    <div className={styles.logo}>
                        <Link href="/">
                            <Icon name={"logo"} size={200} color="#000"/>
                        </Link>
                    </div>
                    <div className={styles.backM}>
                        <Link href="/">
                            <Icon name={showSearch?"back":"logo"} size={24} color="#000"/>
                        </Link>
                    </div>
                </div>
                {showSearch && (
                    <SearchForm header={true}/>
                )}
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
                <div className={styles.headerRowM}></div>
            </header>
            <AuthModal open={authModalOpen} setOpen={setAuthModalOpen} />
        </>
    );
};

export default Header;
