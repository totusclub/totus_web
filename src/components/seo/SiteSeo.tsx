import Head from 'next/head';
import { useRouter } from 'next/router';
import {
    SITE_NAME,
    getSiteOrigin,
    resolveRouteSeo,
    type SeoOverride,
} from "@/config/seo";

type PagePropsWithSeo = {
    seo?: SeoOverride;
};

type SiteSeoProps = {
    pageProps: PagePropsWithSeo;
};

export default function SiteSeo({ pageProps }: SiteSeoProps) {
    const router = useRouter();
    const base = resolveRouteSeo(router.pathname);
    const o = pageProps?.seo;

    let title: string;
    if (o?.title) {
        title = o.title;
    } else if (router.pathname === '/') {
        title = base.title;
    } else if (base.title === SITE_NAME) {
        title = SITE_NAME;
    } else {
        title = `${base.title} | ${SITE_NAME}`;
    }
    const description = o?.description ?? base.description;
    const keywords = o?.keywords ?? base.keywords;
    const noIndex = o?.noIndex ?? base.noIndex;

    const origin = getSiteOrigin();
    const path = router.asPath?.split('?')[0] || router.pathname;
    const canonical = origin ? `${origin}${path === '' ? '/' : path}` : '';

    const ogImage = o?.ogImage
        ? o.ogImage.startsWith('http')
            ? o.ogImage
            : origin
              ? `${origin}${o.ogImage.startsWith('/') ? o.ogImage : `/${o.ogImage}`}`
              : o.ogImage
        : origin
          ? `${origin}/android-chrome-512x512.png`
          : '';

    return (
        <Head>
            <meta
                name="viewport"
                content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no"
            />
            <title>{title}</title>
            <meta name="description" content={description} />
            <meta name="keywords" content={keywords} />
            <meta name="author" content={SITE_NAME} />
            <meta name="application-name" content={SITE_NAME} />

            {noIndex ? (
                <meta name="robots" content="noindex, nofollow" />
            ) : (
                <meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1" />
            )}

            {canonical ? <link rel="canonical" href={canonical} /> : null}

            <meta property="og:type" content="website" />
            <meta property="og:site_name" content={SITE_NAME} />
            <meta property="og:locale" content="ru_RU" />
            <meta property="og:title" content={title} />
            <meta property="og:description" content={description} />
            {canonical ? <meta property="og:url" content={canonical} /> : null}
            {ogImage ? <meta property="og:image" content={ogImage} /> : null}

            <meta name="twitter:card" content="summary_large_image" />
            <meta name="twitter:title" content={title} />
            <meta name="twitter:description" content={description} />
            {ogImage ? <meta name="twitter:image" content={ogImage} /> : null}
        </Head>
    );
}
