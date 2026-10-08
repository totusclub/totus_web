import Head from 'next/head';
import { StaticInfoPage } from '@/components/staticInfoPage';
import { FaqContent } from '@/components/infoPages/FaqContent';
import { FOOTER_STATIC_BY_SLUG } from '@/config/footerStaticPages';

export default function HelpFaqPage() {
    const def = FOOTER_STATIC_BY_SLUG['help-faq'];
    return (
        <>
            <Head>
                <title>{def.seo.title}</title>
                <meta name="description" content={def.seo.description} />
                <meta name="keywords" content={def.seo.keywords} />
            </Head>
            <StaticInfoPage
                title="Частые вопросы"
                section={def.section}
                currentLabel="Частые вопросы"
                breadcrumbMid="Помощь"
            >
                <FaqContent />
            </StaticInfoPage>
        </>
    );
}
