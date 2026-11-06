'use client';

import { useEffect, useState } from 'react';
import { API_BASE_URL } from '@/config/api';
import type { CmsPagePayload } from '@/lib/cmsPage';

// Только публичный маршрут страниц (запасное обращение к админскому маршруту убрано — SECURITY_ENFORCE_MATRIX).
async function loadCmsPage(slug: string): Promise<CmsPagePayload | null> {
    try {
        const response = await fetch(`${API_BASE_URL}/api/pages/slug/${encodeURIComponent(slug)}`, {
            headers: { Accept: 'application/json' },
            cache: 'no-store',
        });
        if (!response.ok) return null;
        return (await response.json()) as CmsPagePayload;
    } catch {
        return null;
    }
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
