// Юридические документы Totus Club и реквизиты ООО «ТОТУСКЛАБ».
// Один источник для страницы /legal («Правовая информация») и проверки scripts/check-legal-pages.mjs.
// Файл без импортов: проверка загружает его напрямую в Node (type stripping).

export type LegalDoc = {
    /** Маршрут страницы документа без слэша: src/pages/<slug>/index.tsx */
    slug: string;
    href: string;
    title: string;
    description: string;
};

/** Страница «Реквизиты и контакты» — последний документ в списке; на неё же ведёт ссылка из карточки компании. */
export const LEGAL_REQUISITES: LegalDoc = {
    slug: 'requisites',
    href: '/requisites',
    title: 'Реквизиты и контакты',
    description: 'Реквизиты ООО «ТОТУСКЛАБ» и контакты поддержки',
};

/** Опубликованные документы — блок «Пользователям» на /legal. */
export const LEGAL_DOCS: LegalDoc[] = [
    {
        slug: 'terms',
        href: '/terms',
        title: 'Пользовательское соглашение',
        description: 'Условия использования сайта и приложений Totus Club',
    },
    {
        slug: 'privacy-policy',
        href: '/privacy-policy',
        title: 'Политика обработки персональных данных',
        description: 'Какие данные мы обрабатываем, зачем и как их защищаем',
    },
    {
        slug: 'consent',
        href: '/consent',
        title: 'Согласие на обработку персональных данных',
        description: 'Текст согласия, которое даётся в формах сайта и приложения',
    },
    {
        slug: 'personalization-consent',
        href: '/personalization-consent',
        title: 'Согласие на обработку персональных данных для персональных рекомендаций',
        description: 'Что учитывается в подборках, срок согласия и как его отозвать',
    },
    {
        slug: 'ads-consent',
        href: '/ads-consent',
        title: 'Согласие на получение рекламы',
        description: 'Рассылки, push-уведомления и как от них отказаться',
    },
    {
        slug: 'marketing-data-consent',
        href: '/marketing-data-consent',
        title: 'Согласие на обработку персональных данных для направления рекламы',
        description: 'Какие данные нужны для рекламных писем, срок согласия и отказ',
    },
    {
        slug: 'cookie-settings',
        href: '/cookie-settings',
        title: 'Политика использования файлов cookie',
        description: 'Какие cookie мы используем и как ими управлять',
    },
    {
        slug: 'recommendations',
        href: '/recommendations',
        title: 'Правила применения рекомендательных технологий',
        description: 'Как формируются подборки и порядок отелей в выдаче',
    },
    {
        slug: 'tour-offer',
        href: '/tour-offer',
        title: 'Оферта о заключении договора о реализации туристского продукта',
        description: 'Условия покупки тура: заявка, цена и оплата, права сторон, отмена, претензии',
    },
    {
        slug: 'booking-application',
        href: '/booking-application',
        title: 'Форма заявки на бронирование туристского продукта',
        description: 'Какие сведения о заказе, туристах и услугах указываются в заявке',
    },
    {
        slug: 'operator-information',
        href: '/operator-information',
        title: 'Форма информации о туроператоре',
        description: 'Сведения о туроператоре, финансовом обеспечении и порядке возмещения',
    },
    {
        slug: 'hotel-booking',
        href: '/hotel-booking',
        title: 'Условия бронирования размещения',
        description: 'Бронирование отелей без перелёта: подтверждение, оплата, заселение, отмена',
    },
    {
        slug: 'cancellation',
        href: '/cancellation',
        title: 'Изменение, отмена и возврат',
        description: 'Как изменить или отменить тур и бронирование, сроки возврата денег',
    },
    {
        slug: 'tourist-memo',
        href: '/tourist-memo',
        title: 'Памятка туристу',
        description: 'Документы, визы, страхование, аэропорт, что делать на месте, важные контакты',
    },
    {
        slug: 'payment',
        href: '/payment',
        title: 'Оплата и возврат денег',
        description: 'Способы оплаты, кассовый чек, возврат денег, безопасность платежей',
    },
    LEGAL_REQUISITES,
];

/** Карточка компании на /legal. */
export const LEGAL_COMPANY = {
    name: 'ООО «ТОТУСКЛАБ»',
    inn: '9729424935',
    kpp: '772901001',
    ogrn: '1267700310382',
    address:
        '119361, г. Москва, вн.тер.г. муниципальный округ Очаково-Матвеевское, пер. 2-й Очаковский, д. 4, помещ. 1/2',
    /**
     * Реестровый номер турагента — из настройки сайта NEXT_PUBLIC_TOURAGENT_REGISTRY_NUMBER.
     * Пока номера нет, строка на /legal и в подвале не показывается (без заглушек на боевом сайте).
     */
    touragentRegistry: (process.env.NEXT_PUBLIC_TOURAGENT_REGISTRY_NUMBER || '').trim(),
};
