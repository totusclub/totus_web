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
        currentLabel: 'О Нас',
        mobileHeaderTitle: 'О нас',
        breadcrumbMid: 'О компании',
        paragraphs: [
            'Totus Club — сервис по поиску и бронированию турпакетов и отелей.',
            'Мы объединяем предложения партнёров и помогаем путешественникам выбирать поездку с прозрачными условиями.',
            'Если у вас есть вопросы по сотрудничеству или сервису, воспользуйтесь контактами на сайте.',
        ],
        seo: {
            title: 'О нас',
            description: 'Totus Club — сервис по поиску и бронированию туров и отелей.',
            keywords: 'Totus Club, о нас, туры, бронирование',
        },
    },
    'privacy-policy': {
        slug: 'privacy-policy',
        section: 'legal',
        title: 'Политика конфиденциальности',
        currentLabel: 'Конфиденциальность',
        mobileHeaderTitle: 'Политика конфиденциальности',
        paragraphs: [
            'На этой странице опубликована политика конфиденциальности Totus Club.',
        ],
        seo: {
            title: 'Политика конфиденциальности',
            description: 'Политика конфиденциальности Totus Club.',
            keywords: 'Totus Club, конфиденциальность, персональные данные',
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
