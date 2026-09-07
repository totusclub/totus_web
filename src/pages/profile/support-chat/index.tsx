import Head from 'next/head';
import MenuProfile from '@/components/profile/menu';
import SupportChat from '@/components/support/chat/SupportChat';
import withAuth from '@/utils/withAuth';
import styles from '@/components/support/chat/supportChat.module.css';

/**
 * /profile/support-chat — «Чат с поддержкой».
 * Desktop (>1024): меню ЛК слева + карточка чата справа (как /profile).
 * Mobile: карточка чата занимает весь экран (fixed, см. supportChat.module.css), меню скрыто.
 */
const SupportChatPage = () => {
    return (
        <>
            <Head>
                <title>Чат с поддержкой — Totus Club</title>
                <meta name="robots" content="noindex" />
            </Head>
            <main className={'searchContainer'}>
                <div className={'content row'}>
                    <div className={styles.pageMenu}>
                        <MenuProfile />
                    </div>
                    <SupportChat />
                </div>
            </main>
        </>
    );
};

export default withAuth(SupportChatPage);
