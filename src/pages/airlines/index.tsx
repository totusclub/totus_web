import Head from 'next/head';
import { StaticInfoPage } from '@/components/staticInfoPage';
import { AirlinesContent } from '@/components/infoPages/AirlinesContent';
import { FOOTER_STATIC_BY_SLUG } from '@/config/footerStaticPages';

export default function AirlinesPage() {
    const def = FOOTER_STATIC_BY_SLUG['airlines'];
    return (
        <>
            <Head>
                <title>{def.seo.title}</title>
                <meta name="description" content={def.seo.description} />
                <meta name="keywords" content={def.seo.keywords} />
            </Head>
            <StaticInfoPage
                title={def.title}
                section={def.section}
                currentLabel={def.currentLabel}
                breadcrumbMid="Помощь"
            >
                <AirlinesContent />
            </StaticInfoPage>
        </>
    );
}
