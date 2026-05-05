import type { StaticInfoSection } from "@/components/staticInfoPage";

/** Matches RouteSeoEntry in seo.ts (kept local to avoid circular imports). */
type FooterRouteSeo = {
    title: string;
    description: string;
    keywords: string;
};

export type FooterStaticSlug =
    | "career"
    | "blog"
    | "how-we-work"
    | "help-faq"
    | "press"
    | "branches"
    | "hotel-owners"
    | "partners"
    | "advertise"
    | "airline-fees"
    | "airlines"
    | "low-fare-tips"
    | "badges-certificates"
    | "security"
    | "cookie-settings"
    | "terms"
    | "ad-choices";

type FooterStaticDef = {
    slug: FooterStaticSlug;
    section: StaticInfoSection;
    title: string;
    currentLabel: string;
    mobileHeaderTitle: string;
    paragraphs: string[];
    seo: FooterRouteSeo;
};

const p =
    "";

const defs: FooterStaticDef[] = [
    {
        slug: "career",
        section: "company",
        title: "Карьера",
        currentLabel: "Карьера",
        mobileHeaderTitle: "Карьера",
        paragraphs: [
            "Totus Club развивает продукты для путешественников и партнёров индустрии. Мы ищем специалистов в продукт, инженерию, аналитику и клиентский сервис.",
            p,
        ],
        seo: {
            title: "Карьера",
            description: "Вакансии и работа в Totus Club: туристический клуб и технологичная платформа бронирования.",
            keywords: "Totus Club, карьера, вакансии, работа",
        },
    },
    {
        slug: "blog",
        section: "company",
        title: "Блог",
        currentLabel: "Блог",
        mobileHeaderTitle: "Блог",
        paragraphs: [
            "В блоге Totus Club публикуем материалы о путешествиях, направлениях, акциях и лайфхаках для туристов.",
            p,
        ],
        seo: {
            title: "Блог",
            description: "Блог Totus Club о путешествиях, турах и отдыхе.",
            keywords: "Totus Club, блог, путешествия, туры",
        },
    },
    {
        slug: "how-we-work",
        section: "company",
        title: "Как мы работаем",
        currentLabel: "Как мы работаем",
        mobileHeaderTitle: "Как мы работаем",
        paragraphs: [
            "Мы собираем предложения партнёров, показываем актуальные цены и условия и сопровождаем оформление заказа до подтверждения бронирования.",
            p,
        ],
        seo: {
            title: "Как мы работаем",
            description: "Как устроен сервис Totus Club: поиск туров, бронирование и поддержка.",
            keywords: "Totus Club, как работает сервис, бронирование туров",
        },
    },
    {
        slug: "help-faq",
        section: "contact",
        title: "Помощь и часто задаваемые вопросы",
        currentLabel: "Помощь / FAQ",
        mobileHeaderTitle: "Помощь и FAQ",
        paragraphs: [
            "Ответы на популярные вопросы о поиске туров, оплате, изменении заказа и возвратах. Если нужного ответа нет — напишите в поддержку.",
            p,
        ],
        seo: {
            title: "Помощь и FAQ",
            description: "Помощь и частые вопросы по сервису Totus Club.",
            keywords: "Totus Club, помощь, FAQ, поддержка",
        },
    },
    {
        slug: "press",
        section: "contact",
        title: "Пресса",
        currentLabel: "Пресса",
        mobileHeaderTitle: "Пресса",
        paragraphs: [
            "Для СМИ: пресс-релизы, комментарии экспертов и медиакиты Totus Club будут доступны на этой странице.",
            p,
        ],
        seo: {
            title: "Пресса",
            description: "Пресс-центр Totus Club для журналистов и СМИ.",
            keywords: "Totus Club, пресса, СМИ, пресс-релизы",
        },
    },
    {
        slug: "branches",
        section: "contact",
        title: "Филиалы",
        currentLabel: "Филиалы",
        mobileHeaderTitle: "Филиалы",
        paragraphs: [
            "Информация о представительствах и офисах Totus Club для клиентов и партнёров.",
            p,
        ],
        seo: {
            title: "Филиалы",
            description: "Филиалы и контакты Totus Club.",
            keywords: "Totus Club, филиалы, офисы, контакты",
        },
    },
    {
        slug: "hotel-owners",
        section: "contact",
        title: "Владельцы отелей",
        currentLabel: "Владельцы отелей",
        mobileHeaderTitle: "Владельцы отелей",
        paragraphs: [
            "Подключение объектов размещения к платформе Totus Club: условия сотрудничества и техническая интеграция.",
            p,
        ],
        seo: {
            title: "Владельцы отелей",
            description: "Сотрудничество для отельеров и владельцев объектов размещения на Totus Club.",
            keywords: "Totus Club, отели, партнёрам, размещение",
        },
    },
    {
        slug: "partners",
        section: "contact",
        title: "Партнёры",
        currentLabel: "Партнёры",
        mobileHeaderTitle: "Партнёры",
        paragraphs: [
            "Партнёрские программы Totus Club для туроператоров, агентств и смежных сервисов.",
            p,
        ],
        seo: {
            title: "Партнёры",
            description: "Партнёрство с Totus Club для бизнеса.",
            keywords: "Totus Club, партнёры, B2B, сотрудничество",
        },
    },
    {
        slug: "advertise",
        section: "contact",
        title: "Рекламируйтесь у нас",
        currentLabel: "Реклама",
        mobileHeaderTitle: "Реклама у нас",
        paragraphs: [
            "Размещение рекламы и спецпроектов на платформе Totus Club: охваты, форматы и контакты отдела рекламы.",
            p,
        ],
        seo: {
            title: "Реклама у нас",
            description: "Реклама на Totus Club: размещение и спецпроекты.",
            keywords: "Totus Club, реклама, медиакит",
        },
    },
    {
        slug: "airline-fees",
        section: "more",
        title: "Авиакомпанийные сборы",
        currentLabel: "Авиасборы",
        mobileHeaderTitle: "Авиасборы",
        paragraphs: [
            "Справочная информация о таксах и сборах авиакомпаний, которые могут включаться в стоимость билета или оплачиваться отдельно.",
            p,
        ],
        seo: {
            title: "Авиакомпанийные сборы",
            description: "Авиакомпанийные сборы и таксы на Totus Club.",
            keywords: "Totus Club, авиасборы, таксы, билеты",
        },
    },
    {
        slug: "airlines",
        section: "more",
        title: "Авиакомпании",
        currentLabel: "Авиакомпании",
        mobileHeaderTitle: "Авиакомпании",
        paragraphs: [
            "Обзор авиакомпаний, представленных в поиске Totus Club, и ссылки на правила перевозки.",
            p,
        ],
        seo: {
            title: "Авиакомпании",
            description: "Авиакомпании в каталоге Totus Club.",
            keywords: "Totus Club, авиакомпании, перелёты",
        },
    },
    {
        slug: "low-fare-tips",
        section: "more",
        title: "Советы по низким тарифам",
        currentLabel: "Низкие тарифы",
        mobileHeaderTitle: "Советы по тарифам",
        paragraphs: [
            "Как выбирать даты, направления и тарифы, чтобы снизить стоимость перелёта и тура без потери качества поездки.",
            p,
        ],
        seo: {
            title: "Советы по низким тарифам",
            description: "Как найти выгодные тарифы на Totus Club.",
            keywords: "Totus Club, дешёвые билеты, тарифы, советы",
        },
    },
    {
        slug: "badges-certificates",
        section: "more",
        title: "Значки и сертификаты",
        currentLabel: "Значки и сертификаты",
        mobileHeaderTitle: "Значки",
        paragraphs: [
            "Значки доверия, сертификаты безопасности платежей и партнёрские награды Totus Club.",
            p,
        ],
        seo: {
            title: "Значки и сертификаты",
            description: "Значки и сертификаты Totus Club.",
            keywords: "Totus Club, сертификаты, безопасность",
        },
    },
    {
        slug: "security",
        section: "more",
        title: "Безопасность",
        currentLabel: "Безопасность",
        mobileHeaderTitle: "Безопасность",
        paragraphs: [
            "Как Totus Club защищает платежи и персональные данные, рекомендации по безопасному использованию аккаунта.",
            p,
        ],
        seo: {
            title: "Безопасность",
            description: "Безопасность сервиса и платежей Totus Club.",
            keywords: "Totus Club, безопасность, защита данных",
        },
    },
    {
        slug: "cookie-settings",
        section: "legal",
        title: "Настройки файлов cookie",
        currentLabel: "Cookie",
        mobileHeaderTitle: "Настройки cookie",
        paragraphs: [
            "Управление категориями cookie на сайте Totus Club. Вы можете изменить выбор в любой момент.",
            p,
        ],
        seo: {
            title: "Настройки cookie",
            description: "Настройки файлов cookie на сайте Totus Club.",
            keywords: "Totus Club, cookie, куки, настройки",
        },
    },
    {
        slug: "terms",
        section: "legal",
        title: "Условия и положения",
        currentLabel: "Условия",
        mobileHeaderTitle: "Условия",
        paragraphs: [
            "Пользовательское соглашение и условия использования сервиса Totus Club, включая правила бронирования и оплаты.",
            p,
        ],
        seo: {
            title: "Условия и положения",
            description: "Условия использования Totus Club.",
            keywords: "Totus Club, условия, пользовательское соглашение",
        },
    },
    {
        slug: "ad-choices",
        section: "legal",
        title: "Выбор рекламы",
        currentLabel: "Выбор рекламы",
        mobileHeaderTitle: "Выбор рекламы",
        paragraphs: [
            "Как работает персонализация рекламы на Totus Club и как ограничить использование данных для рекламных целей.",
            p,
        ],
        seo: {
            title: "Выбор рекламы",
            description: "Настройки рекламы и персонализации на Totus Club.",
            keywords: "Totus Club, реклама, персонализация, настройки",
        },
    },
];

export const FOOTER_STATIC_BY_SLUG = Object.fromEntries(
    defs.map((d) => [d.slug, d])
) as Record<FooterStaticSlug, FooterStaticDef>;

export const FOOTER_STATIC_SEO: Record<string, FooterRouteSeo> = Object.fromEntries(
    defs.map((d) => [`/${d.slug}`, d.seo])
);

const fromDefs: Record<string, string> = Object.fromEntries(
    defs.map((d) => [d.slug, d.mobileHeaderTitle])
);

/** Last URL segment → mobile header title (includes footer static + manual entries). */
export const FOOTER_STATIC_MOBILE_TITLES: Record<string, string> = {
    "about-us": "О нас",
    "privacy-policy": "Политика конфиденциальности",
    apps: "Приложения",
    ...fromDefs,
};
