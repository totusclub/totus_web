import type { StaticInfoSection } from '@/components/staticInfoPage';
import {
    FOOTER_STATIC_BY_SLUG,
    FOOTER_STATIC_MOBILE_TITLES,
    type FooterStaticSlug,
} from '@/config/footerStaticPages';

export type CmsPageSlug = FooterStaticSlug | 'about-us' | 'privacy-policy';

type CmsPageDef = {
    slug: CmsPageSlug;
    section: StaticInfoSection;
    title: string;
    currentLabel: string;
    mobileHeaderTitle: string;
    breadcrumbMid?: string;
    paragraphs: string[];
    seo: {
        title: string;
        description: string;
        keywords: string;
    };
};

const EXTRA_DEFS: Record<'about-us' | 'privacy-policy', CmsPageDef> = {
    'about-us': {
        slug: 'about-us',
        section: 'company',
        title: 'О нас',
        currentLabel: 'О нас',
        mobileHeaderTitle: 'О нас',
        breadcrumbMid: 'О компании',
        paragraphs: [
            'Totus Club — сервис для поиска и бронирования туров и отелей.',
            'Мы собираем в одной выдаче предложения крупных туроператоров, показываем цены и условия до оплаты и помогаем выбрать поездку.',
        ],
        seo: {
            title: 'О нас',
            description:
                'Totus Club — сервис для поиска и бронирования туров и отелей: предложения крупных туроператоров, ИИ-ассистент Маша и живая поддержка.',
            keywords: 'Totus Club, о нас, туры, отели, бронирование, ТОТУСКЛАБ',
        },
    },
    'privacy-policy': {
        slug: 'privacy-policy',
        section: 'legal',
        title: 'Политика обработки персональных данных',
        currentLabel: 'Политика обработки персональных данных',
        mobileHeaderTitle: 'Политика обработки персональных данных',
        paragraphs: [
            'На этой странице опубликована политика обработки персональных данных ООО «ТОТУСКЛАБ».',
        ],
        seo: {
            title: 'Политика обработки персональных данных',
            description: 'Политика обработки персональных данных Totus Club (ООО «ТОТУСКЛАБ»).',
            keywords: 'Totus Club, политика обработки персональных данных, конфиденциальность, персональные данные',
        },
    },
};

export function getCmsPageDef(slug: CmsPageSlug): CmsPageDef {
    if (slug in FOOTER_STATIC_BY_SLUG) {
        const def = FOOTER_STATIC_BY_SLUG[slug as FooterStaticSlug];
        return {
            slug,
            section: def.section,
            title: def.title,
            currentLabel: def.currentLabel,
            mobileHeaderTitle: def.mobileHeaderTitle,
            paragraphs: def.paragraphs,
            seo: def.seo,
        };
    }
    return EXTRA_DEFS[slug as 'about-us' | 'privacy-policy'];
}

export function resolveCmsMobileTitle(slug: string, cmsTitle?: string): string | undefined {
    if (cmsTitle?.trim()) return cmsTitle.trim();
    return FOOTER_STATIC_MOBILE_TITLES[slug];
}
