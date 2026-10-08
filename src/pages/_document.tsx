import { Head, Html, Main, NextScript } from 'next/document';
import { THEME_INIT_SCRIPT } from '@/utils/theme';

export default function Document() {
    return (
        <Html lang="ru">
            <Head>
                {/* Тема оформления до отрисовки: выбор пользователя или тема устройства (без белой вспышки) */}
                <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
                <link rel="icon" href="/favicon.ico" sizes="any" />
                <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
                <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />
                <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
                <link rel="manifest" href="/site.webmanifest" />
                <meta name="theme-color" content="#ffffff" />
                {/* API (данные, картинки hero/баннеров/направлений) и CDN фото отелей — соединение заранее */}
                <link rel="preconnect" href="https://api.totus.club" />
                <link rel="preconnect" href="https://api.totus.club" crossOrigin="" />
                <link rel="preconnect" href="https://img.cdn.level.travel" />
            </Head>
            <body>
                <Main />
                <NextScript />
            </body>
        </Html>
    );
}
