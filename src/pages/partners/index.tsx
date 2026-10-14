import Head from 'next/head';
import { StaticInfoPage } from '@/components/staticInfoPage';
import { PartnersContent } from '@/components/infoPages/PartnersContent';
import { FOOTER_STATIC_BY_SLUG } from '@/config/footerStaticPages';

// Макет Figma «Партнёры» (14.10.2026). Текст в коде, CMS для /partners больше не используется.
export default function PartnersPage() {
    const def = FOOTER_STATIC_BY_SLUG['partners'];
    return (
        <>
            <Head>
                <title>{def.seo.title}</title>
                <meta name="description" content={def.seo.description} />
                <meta name="keywords" content={def.seo.keywords} />
            </Head>
            <StaticInfoPage
                title="Партнёры"
                section={def.section}
                currentLabel="Партнёры"
                breadcrumbMid="О компании"
                plain
            >
                <PartnersContent />
            </StaticInfoPage>
        </>
    );
}
