import Head from 'next/head';
import { StaticInfoPage } from '@/components/staticInfoPage';
import { AboutContent } from '@/components/infoPages/AboutContent';
import { getCmsPageDef } from '@/config/cmsPageDefs';

export default function AboutUsPage() {
    const def = getCmsPageDef('about-us');
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
                breadcrumbMid={def.breadcrumbMid}
            >
                <AboutContent />
            </StaticInfoPage>
        </>
    );
}
