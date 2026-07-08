import type { GetServerSideProps } from 'next';
import { fetchCmsPageBySlug, type CmsPagePayload } from '@/lib/cmsPage';
import { CmsStaticPage } from '@/components/staticInfoPage/CmsStaticPage';
import type { CmsPageSlug } from '@/config/cmsPageDefs';

type CmsPageProps = {
    cms: CmsPagePayload | null;
    slug: CmsPageSlug;
};

export function createCmsPageHandlers(slug: CmsPageSlug) {
    const getServerSideProps: GetServerSideProps<CmsPageProps> = async () => {
        const cms = await fetchCmsPageBySlug(slug);
        return {
            props: {
                cms,
                slug,
            },
        };
    };

    function Page({ cms }: CmsPageProps) {
        return <CmsStaticPage slug={slug} cms={cms} />;
    }

    return { Page, getServerSideProps };
}
