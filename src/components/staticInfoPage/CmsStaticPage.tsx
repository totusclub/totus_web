'use client';

import { useEffect, useState } from 'react';
import Head from 'next/head';
import type { CmsPagePayload } from '@/lib/cmsPage';
import { getCmsPageDef, type CmsPageSlug } from '@/config/cmsPageDefs';
import { API_BASE_URL } from '@/config/api';
import { sanitizeCmsHtml } from '@/lib/sanitizeHtml';
import { StaticInfoPage } from './index';
import styles from './staticInfoPage.module.css';

type Props = {
    slug: CmsPageSlug;
    cms?: CmsPagePayload | null;
};

function stripWhiteBackgrounds(html: string): string {
    if (typeof document === 'undefined') {
        return html
            .replace(/\sbgcolor=["'][^"']*["']/gi, '')
            .replace(/background(?:-color)?\s*:\s*(?:#fff(?:fff)?|white|rgb\(\s*255\s*,\s*255\s*,\s*255\s*\)[^;"']*)/gi, '');
    }

    const container = document.createElement('div');
    container.innerHTML = html;

    container.querySelectorAll('*').forEach((node) => {
        if (!(node instanceof HTMLElement)) return;
        node.removeAttribute('bgcolor');
        node.removeAttribute('background');

        const bg = node.style.backgroundColor || node.style.background;
        if (
            bg &&
            /#fff(?:fff)?|white|rgb\(\s*255\s*,\s*255\s*,\s*255/i.test(bg)
        ) {
            node.style.removeProperty('background');
            node.style.removeProperty('background-color');
            node.style.removeProperty('background-image');
        }

        if (node.hasAttribute('style')) {
            const cleaned = (node.getAttribute('style') || '')
                .split(';')
                .map((part) => part.trim())
                .filter((part) => {
                    if (!part) return false;
                    const lower = part.toLowerCase();
                    if (!lower.startsWith('background')) return true;
                    const value = part.split(':').slice(1).join(':').trim();
                    return !/#fff(?:fff)?|white|rgb\(\s*255\s*,\s*255\s*,\s*255/i.test(value);
                })
                .join('; ');
            if (cleaned) node.setAttribute('style', cleaned);
            else node.removeAttribute('style');
        }
    });

    return container.innerHTML;
}

function normalizeCmsHtml(html?: string | null): string {
    let raw = String(html || '').trim();
    if (!raw) return '';

    raw = raw.replace(
        /(<img[^>]*\ssrc=["'])([^"']+)(["'][^>]*>)/gi,
        (_match, start, src, end) => {
            let fixed = src;
            try {
                fixed = encodeURI(decodeURI(src));
            } catch {
                fixed = encodeURI(src);
            }
            return `${start}${fixed}${end}`;
        },
    );

    raw = raw
        .replace(/(?:&nbsp;|\xa0|\s){2,}/gi, ' ')
        .replace(/<(p|div|span)[^>]*>\s*<\/\1>/gi, '')
        .replace(/^(?:\s|<br\s*\/?>)+/i, '')
        .trim();

    // H6 аудита: HTML из CMS — только разметка статьи, без скриптов/фреймов/обработчиков (src/lib/sanitizeHtml.ts).
    return sanitizeCmsHtml(stripWhiteBackgrounds(raw));
}

// Только публичный маршрут страниц. Запасные обращения к админским маршрутам страниц убраны
// (SECURITY_ENFORCE_MATRIX: админские маршруты закрываются для сайта при AUTH_MODE=enforce).
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

export function CmsStaticPage({ slug, cms: initialCms }: Props) {
    const def = getCmsPageDef(slug);
    const [cms, setCms] = useState<CmsPagePayload | null>(initialCms ?? null);
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

    const content = normalizeCmsHtml(cms?.content);
    const title = cms?.name?.trim() || def.title;
    const section = (cms?.section as typeof def.section) || def.section;
    const currentLabel = cms?.breadcrumb_label?.trim() || def.currentLabel;
    const seoTitle = cms?.seo_title?.trim() || def.seo.title;
    const seoDescription = cms?.seo_desc?.trim() || def.seo.description;
    const seoKeywords = cms?.seo_keywords?.trim() || def.seo.keywords;

    return (
        <>
            <Head>
                <title>{seoTitle}</title>
                <meta name="description" content={seoDescription} />
                <meta name="keywords" content={seoKeywords} />
            </Head>
            <StaticInfoPage
                title={title}
                section={section}
                currentLabel={currentLabel}
                breadcrumbMid={def.breadcrumbMid}
            >
                <div className={styles.body}>
                    {content ? (
                        <div
                            className={styles.cmsHtml}
                            dangerouslySetInnerHTML={{ __html: content }}
                        />
                    ) : !loading ? (
                        <p style={{ color: 'var(--textTertiary, #888)' }}>
                            Контент пока не опубликован.
                        </p>
                    ) : null}
                </div>
            </StaticInfoPage>
        </>
    );
}
