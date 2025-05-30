import Link from 'next/link';
import Head from 'next/head';
import styles from './header.module.css';
import Icon from "@/components/icons/Icon";
import Button from "@/components/UI/button";
import SearchForm from "@/components/search/searchForm";
import {usePathname} from "next/navigation";
import {useMemo} from "react";

const Header = () => {
    const pathname = usePathname();

    const showSearch = useMemo(()=>{
        const segments = pathname.split('/').filter(Boolean); // removes empty strings
        const pageName = segments[segments.length - 1] || 'home';

        console.log('pageName',pageName);
        return pageName === 'search';
    },[pathname])
    return (
        <>
            <Head>
                <title>My Amazing Website</title>
                <meta name="description" content="The best website for amazing products." />
            </Head>
            <header className={styles.header}>
                <div className={styles.headerRow}>
                    <div className={styles.menu}>
                        <Icon name="burger" size={28} color="#000"/>
                    </div>
                    <div className={styles.logo}>
                        <Link href="/">
                            <Icon name="logo" size={200} color="#000"/>
                        </Link>
                    </div>
                </div>
                {showSearch && (
                    <SearchForm header={true}/>
                )}
                <div className={styles.headerRow}>
                    <div className={styles.favorite}>
                        <Icon name="heart" size={24} color="#000"/>
                    </div>
                    <Button title={'Войти'}/>
                </div>
            </header>
        </>
    );
};

export default Header;
