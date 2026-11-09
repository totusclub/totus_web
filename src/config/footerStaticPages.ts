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
    | "ad-choices"
    | "consent"
    | "ads-consent"
    | "recommendations"
    | "requisites"
    | "tour-offer"
    | "hotel-booking"
    | "cancellation"
    | "tourist-memo"
    | "payment"
    | "personalization-consent"
    | "marketing-data-consent"
    | "booking-application"
    | "operator-information";

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
        title: "Политика использования файлов cookie",
        currentLabel: "Политика cookie",
        mobileHeaderTitle: "Политика cookie",
        paragraphs: [
            "Какие файлы cookie использует сайт Totus Club, для чего они нужны и как управлять ими в браузере.",
            p,
        ],
        seo: {
            title: "Политика использования файлов cookie",
            description: "Политика использования файлов cookie на сайте Totus Club (ООО «ТОТУСКЛАБ»).",
            keywords: "Totus Club, cookie, куки, политика cookie, файлы cookie",
        },
    },
    {
        slug: "terms",
        section: "legal",
        title: "Пользовательское соглашение",
        currentLabel: "Пользовательское соглашение",
        mobileHeaderTitle: "Пользовательское соглашение",
        paragraphs: [
            "Пользовательское соглашение и условия использования сервиса Totus Club, включая правила бронирования и оплаты.",
            p,
        ],
        seo: {
            title: "Пользовательское соглашение",
            description: "Пользовательское соглашение сервиса Totus Club (ООО «ТОТУСКЛАБ»): условия использования, бронирования и оплаты.",
            keywords: "Totus Club, пользовательское соглашение, условия использования, оферта",
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
    {
        slug: "consent",
        section: "legal",
        title: "Согласие на обработку персональных данных",
        currentLabel: "Согласие на обработку персональных данных",
        mobileHeaderTitle: "Согласие на обработку персональных данных",
        paragraphs: [
            "Согласие пользователя на обработку персональных данных ООО «ТОТУСКЛАБ».",
            p,
        ],
        seo: {
            title: "Согласие на обработку персональных данных",
            description: "Согласие на обработку персональных данных пользователей Totus Club (ООО «ТОТУСКЛАБ»).",
            keywords: "Totus Club, согласие на обработку персональных данных, персональные данные, 152-ФЗ",
        },
    },
    {
        slug: "ads-consent",
        section: "legal",
        title: "Согласие на получение рекламы",
        currentLabel: "Согласие на рекламу",
        mobileHeaderTitle: "Согласие на рекламу",
        paragraphs: [
            "Согласие на получение рекламных и информационных рассылок Totus Club.",
            p,
        ],
        seo: {
            title: "Согласие на получение рекламы",
            description: "Согласие на получение рекламы и рассылок от Totus Club (ООО «ТОТУСКЛАБ»).",
            keywords: "Totus Club, согласие на рекламу, рассылки, реклама",
        },
    },
    {
        slug: "recommendations",
        section: "legal",
        title: "Правила применения рекомендательных технологий",
        currentLabel: "Рекомендательные технологии",
        mobileHeaderTitle: "Рекомендательные технологии",
        paragraphs: [
            "Как Totus Club применяет рекомендательные технологии при подборе туров и отелей.",
            p,
        ],
        seo: {
            title: "Правила применения рекомендательных технологий",
            description: "Правила применения рекомендательных технологий на сайте и в приложении Totus Club (ООО «ТОТУСКЛАБ»).",
            keywords: "Totus Club, рекомендательные технологии, рекомендации, правила",
        },
    },
    {
        slug: "requisites",
        section: "legal",
        title: "Реквизиты и контакты",
        currentLabel: "Реквизиты и контакты",
        mobileHeaderTitle: "Реквизиты и контакты",
        paragraphs: [
            "Реквизиты и контактные данные ООО «ТОТУСКЛАБ».",
            p,
        ],
        seo: {
            title: "Реквизиты и контакты",
            description: "Реквизиты и контакты ООО «ТОТУСКЛАБ» — оператора сервиса Totus Club.",
            keywords: "Totus Club, ТОТУСКЛАБ, реквизиты, контакты, ИНН, ОГРН",
        },
    },
    {
        slug: "tour-offer",
        section: "legal",
        title: "Оферта о заключении договора о реализации туристского продукта",
        currentLabel: "Оферта о заключении договора о реализации туристского продукта",
        mobileHeaderTitle: "Оферта о заключении договора о реализации туристского продукта",
        paragraphs: [
            "Условия договора о реализации туристского продукта при покупке тура на Totus Club.",
            p,
        ],
        seo: {
            title: "Оферта о заключении договора о реализации туристского продукта",
            description: "Оферта о заключении договора о реализации туристского продукта на сайте и в приложении Totus Club (ООО «ТОТУСКЛАБ»).",
            keywords: "Totus Club, оферта, договор о реализации туристского продукта, покупка тура, условия тура",
        },
    },
    {
        slug: "hotel-booking",
        section: "legal",
        title: "Условия бронирования размещения",
        currentLabel: "Условия бронирования размещения",
        mobileHeaderTitle: "Условия бронирования размещения",
        paragraphs: [
            "Условия бронирования отелей и других средств размещения без перелёта на Totus Club.",
            p,
        ],
        seo: {
            title: "Условия бронирования размещения",
            description: "Условия бронирования размещения на сайте и в приложении Totus Club (ООО «ТОТУСКЛАБ»): подтверждение, оплата, заселение и отмена.",
            keywords: "Totus Club, бронирование отелей, бронирование размещения, условия бронирования, отели",
        },
    },
    {
        slug: "cancellation",
        section: "legal",
        title: "Изменение, отмена и возврат",
        currentLabel: "Изменение, отмена и возврат",
        mobileHeaderTitle: "Изменение, отмена и возврат",
        paragraphs: [
            "Порядок изменения и отмены туров и бронирований и сроки возврата денег на Totus Club.",
            p,
        ],
        seo: {
            title: "Изменение, отмена и возврат",
            description: "Изменение, отмена и возврат: как изменить или отменить тур и бронирование на Totus Club (ООО «ТОТУСКЛАБ») и сроки возврата денег.",
            keywords: "Totus Club, отмена тура, изменение бронирования, возврат денег, аннуляция",
        },
    },
    {
        slug: "tourist-memo",
        section: "legal",
        title: "Памятка туристу",
        currentLabel: "Памятка туристу",
        mobileHeaderTitle: "Памятка туристу",
        paragraphs: [
            "Что нужно знать перед поездкой и во время путешествия с Totus Club.",
            p,
        ],
        seo: {
            title: "Памятка туристу",
            description: "Памятка туристу Totus Club (ООО «ТОТУСКЛАБ»): документы, визы, страхование, аэропорт, что делать на месте и важные контакты.",
            keywords: "Totus Club, памятка туристу, документы, визы, страхование, путешествие",
        },
    },
    {
        slug: "payment",
        section: "legal",
        title: "Оплата и возврат денег",
        currentLabel: "Оплата и возврат денег",
        mobileHeaderTitle: "Оплата и возврат денег",
        paragraphs: [
            "Способы оплаты заказов на Totus Club, кассовый чек и возврат денег.",
            p,
        ],
        seo: {
            title: "Оплата и возврат денег",
            description: "Оплата и возврат денег на Totus Club (ООО «ТОТУСКЛАБ»): способы оплаты, кассовый чек, возврат денег и безопасность платежей.",
            keywords: "Totus Club, оплата, способы оплаты, кассовый чек, возврат денег, безопасность платежей",
        },
    },
    {
        slug: "personalization-consent",
        section: "legal",
        title: "Согласие на обработку персональных данных для персональных рекомендаций",
        currentLabel: "Согласие на обработку персональных данных для персональных рекомендаций",
        mobileHeaderTitle: "Согласие на обработку персональных данных для персональных рекомендаций",
        paragraphs: [
            "Согласие на обработку истории поисков и просмотров для персональных рекомендаций Totus Club.",
            p,
        ],
        seo: {
            title: "Согласие на обработку персональных данных для персональных рекомендаций",
            description: "Согласие на обработку персональных данных для персональных рекомендаций Totus Club (ООО «ТОТУСКЛАБ»).",
            keywords: "Totus Club, согласие, персональные рекомендации, персональные данные",
        },
    },
    {
        slug: "marketing-data-consent",
        section: "legal",
        title: "Согласие на обработку персональных данных для направления рекламы",
        currentLabel: "Согласие на обработку персональных данных для направления рекламы",
        mobileHeaderTitle: "Согласие на обработку персональных данных для направления рекламы",
        paragraphs: [
            "Согласие на обработку имени и адреса электронной почты для направления рекламы Totus Club.",
            p,
        ],
        seo: {
            title: "Согласие на обработку персональных данных для направления рекламы",
            description: "Согласие на обработку персональных данных для направления рекламы Totus Club (ООО «ТОТУСКЛАБ»).",
            keywords: "Totus Club, согласие, реклама, персональные данные",
        },
    },
    {
        slug: "booking-application",
        section: "legal",
        title: "Форма заявки на бронирование туристского продукта",
        currentLabel: "Форма заявки на бронирование туристского продукта",
        mobileHeaderTitle: "Форма заявки на бронирование туристского продукта",
        paragraphs: [
            "Форма Заявки на бронирование туристского продукта — приложение к договору о реализации туристского продукта.",
            p,
        ],
        seo: {
            title: "Форма заявки на бронирование туристского продукта",
            description: "Форма заявки на бронирование туристского продукта Totus Club (ООО «ТОТУСКЛАБ»): что указывается в заявке по каждому заказу.",
            keywords: "Totus Club, заявка на бронирование, туристский продукт, договор",
        },
    },
    {
        slug: "operator-information",
        section: "legal",
        title: "Форма информации о туроператоре",
        currentLabel: "Форма информации о туроператоре",
        mobileHeaderTitle: "Форма информации о туроператоре",
        paragraphs: [
            "Форма сведений о туроператоре и его финансовом обеспечении — приложение к Заявке и договору.",
            p,
        ],
        seo: {
            title: "Форма информации о туроператоре",
            description: "Форма информации о туроператоре Totus Club (ООО «ТОТУСКЛАБ»): реестровые сведения и финансовое обеспечение туроператора.",
            keywords: "Totus Club, туроператор, финансовое обеспечение, реестр туроператоров",
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
    "privacy-policy": "Политика обработки персональных данных",
    legal: "Правовая информация",
    apps: "Приложения",
    ...fromDefs,
};
