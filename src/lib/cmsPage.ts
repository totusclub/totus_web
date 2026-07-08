import { API_BASE_URL } from '@/config/api';
import type { StaticInfoSection } from '@/components/staticInfoPage';

export type CmsPagePayload = {
    id?: number;
    name: string;
    slug: string;
    seo_title?: string;
    seo_desc?: string;
    seo_keywords?: string;
    section?: StaticInfoSection | string;
    breadcrumb_label?: string;
    mobile_header_title?: string;
    content?: string;
};

export async function fetchCmsPageBySlug(slug: string): Promise<CmsPagePayload | null> {
    const urls = [
        `${API_BASE_URL}/api/pages/slug/${encodeURIComponent(slug)}`,
        `${API_BASE_URL}/api/admin/pages/slug/${encodeURIComponent(slug)}`,
    ];

    for (const url of urls) {
        try {
            const response = await fetch(url, {
                headers: { Accept: 'application/json' },
                cache: 'no-store',
            });
            if (response.status === 404) continue;
            if (!response.ok) {
                console.error('[CMS] Failed to load page', slug, response.status, url);
                continue;
            }
            return (await response.json()) as CmsPagePayload;
        } catch (error) {
            console.error('[CMS] Fetch error', slug, url, error);
        }
    }

    return null;
}

export function cmsPageHasContent(page: CmsPagePayload | null | undefined): boolean {
    return Boolean(page?.content && String(page.content).trim().length > 0);
}
