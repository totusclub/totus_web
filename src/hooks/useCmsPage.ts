'use client';

import { useEffect, useState } from 'react';
import { API_BASE_URL } from '@/config/api';
import type { CmsPagePayload } from '@/lib/cmsPage';

async function loadCmsPage(slug: string): Promise<CmsPagePayload | null> {
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
            if (!response.ok) continue;
            return (await response.json()) as CmsPagePayload;
        } catch {
            // try next url
        }
    }

    return null;
}

export function useCmsPage(slug: string) {
    const [cms, setCms] = useState<CmsPagePayload | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let cancelled = false;
        setLoading(true);

        loadCmsPage(slug)
            .then((page) => {
                if (!cancelled) setCms(page);
            })
            .finally(() => {
                if (!cancelled) setLoading(false);
            });

        return () => {
            cancelled = true;
        };
    }, [slug]);

    return { cms, loading };
}
