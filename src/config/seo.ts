import { FOOTER_STATIC_SEO } from "@/config/footerStaticPages";

/** Totus Club — default SEO copy (Russian) */
export const SITE_NAME = 'Totus Club';

export const SITE_DESCRIPTION_DEFAULT =
    'Totus Club — туристический клуб: подбор туров, отелей и авиабилетов по России и миру. Выгодные предложения, онлайн-бронирование и сопровождение путешественников.';

export const SITE_KEYWORDS_DEFAULT =
    'Totus Club, Тотус Клаб, туристический клуб, туры онлайн, горящие туры, отдых, отели, авиабилеты, бронирование туров, путешествия, туристические пакеты';

export type SeoOverride = {
    title?: string;
    description?: string;
    keywords?: string;
    /** If true, adds robots noindex,nofollow */
    noIndex?: boolean;
    /** Absolute or site-root path for og:image */
    ogImage?: string;
};

export type RouteSeoEntry = {
    title: string;
    description: string;
    keywords: string;
    noIndex?: boolean;
};

const ROUTE_SEO: Record<string, RouteSeoEntry> = {
    '/': {
        title: 'Totus Club — туры, отели и путешествия',
        description: SITE_DESCRIPTION_DEFAULT,
        keywords: SITE_KEYWORDS_DEFAULT,
    },
    '/search': {
        title: 'Поиск туров и отелей',
        description:
            'Найдите туры, отели и авиабилеты на Totus Club. Удобный поиск, актуальные цены и бронирование онлайн.',
        keywords:
            'Totus Club, поиск туров, поиск отелей, авиабилеты онлайн, турпакеты, бронирование отеля, туристический поиск',
    },
    '/tickets': {
        title: 'Билеты и туры',
        description:
            'Подбор авиабилетов и туров на Totus Club. Сравнивайте варианты, выбирайте даты и оформляйте поездку в несколько шагов.',
        keywords: 'Totus Club, авиабилеты, туры, билеты онлайн, перелёты, турпакеты',
    },
    '/hotel-details': {
        title: 'Отель — описание и номера',
        description:
            'Карточка отеля на Totus Club: фото, удобства, номера и условия бронирования. Забронируйте проживание с прозрачными условиями.',
        keywords: 'Totus Club, отель, номера, бронирование отеля, описание отеля, проживание',
    },
    '/booking': {
        title: 'Оформление бронирования',
        description: 'Завершите бронирование тура или отеля в личном кабинете Totus Club.',
        keywords: 'Totus Club, бронирование тура, оформление заказа',
        noIndex: true,
    },
    '/checkout': {
        title: 'Оформление заказа',
        description: 'Безопасное оформление заказа на Totus Club.',
        keywords: 'Totus Club, оформление заказа, оплата тура',
        noIndex: true,
    },
    '/pay': {
        title: 'Оплата',
        description: 'Страница оплаты заказа Totus Club.',
        keywords: 'Totus Club, оплата заказа',
        noIndex: true,
    },
    '/privacy-policy': {
        title: 'Политика обработки персональных данных',
        description:
            'Политика обработки персональных данных туристического клуба Totus Club (ООО «ТОТУСКЛАБ»).',
        keywords: 'Totus Club, политика обработки персональных данных, конфиденциальность, персональные данные',
    },
    '/legal': {
        title: 'Правовая информация',
        description:
            'Правовая информация Totus Club: пользовательское соглашение, политика обработки персональных данных, согласия, правила рекомендательных технологий, оферта на туры, условия бронирования размещения, изменение, отмена и возврат, памятка туристу, оплата и реквизиты ООО «ТОТУСКЛАБ».',
        keywords:
            'Totus Club, ТОТУСКЛАБ, правовая информация, юридические документы, пользовательское соглашение, персональные данные, оферта, бронирование, возврат, памятка туристу, оплата, реквизиты',
    },
    '/about-us': {
        title: 'О нас',
        description:
            'Totus Club — туристический клуб: подбор туров и отелей, современная платформа бронирования и сопровождение путешественников.',
        keywords: 'Totus Club, о компании, туристический клуб, туры, бронирование',
    },
    '/apps': {
        title: 'Мобильное приложение Totus Club',
        description:
            'Скачайте приложение Totus Club для iOS и Android: поиск туров и отелей, избранное, заказы и поддержка в одном месте.',
        keywords: 'Totus Club, приложение, iOS, Android, мобильное приложение, туры, отели',
    },
    '/profile': {
        title: 'Личный кабинет',
        description: 'Профиль пользователя Totus Club: данные аккаунта и настройки.',
        keywords: 'Totus Club, личный кабинет, профиль',
        noIndex: true,
    },
    '/profile/my-orders': {
        title: 'Мои заказы',
        description: 'История и статус заказов Totus Club.',
        keywords: 'Totus Club, мои заказы, история бронирований',
        noIndex: true,
    },
    '/profile/my-orders/[order_id]': {
        title: 'Детали заказа',
        description: 'Информация по заказу в Totus Club.',
        keywords: 'Totus Club, детали заказа, бронирование',
        noIndex: true,
    },
    '/404': {
        title: 'Страница не найдена',
        description: 'Запрашиваемая страница на сайте Totus Club не существует или была удалена.',
        keywords: 'Totus Club, 404, страница не найдена',
        noIndex: true,
    },
    ...FOOTER_STATIC_SEO,
};

export function resolveRouteSeo(pathname: string): RouteSeoEntry {
    if (ROUTE_SEO[pathname]) {
        return ROUTE_SEO[pathname];
    }
    return {
        title: SITE_NAME,
        description: SITE_DESCRIPTION_DEFAULT,
        keywords: SITE_KEYWORDS_DEFAULT,
    };
}

export function getSiteOrigin(): string {
    const raw = process.env.NEXT_PUBLIC_SITE_URL?.trim();
    if (!raw) return '';
    return raw.replace(/\/$/, '');
}
