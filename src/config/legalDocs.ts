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

export type UpcomingLegalDoc = {
    title: string;
    description: string;
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
        slug: 'ads-consent',
        href: '/ads-consent',
        title: 'Согласие на получение рекламы',
        description: 'Рассылки, push-уведомления и как от них отказаться',
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
];

/** Документы в подготовке — блок «Готовятся» на /legal (без ссылок). */
export const LEGAL_DOCS_UPCOMING: UpcomingLegalDoc[] = [
    {
        title: 'Оферта о реализации туристского продукта',
        description: 'Договор при покупке тура',
    },
    {
        title: 'Условия бронирования размещения',
        description: 'Бронирование отелей без перелёта',
    },
    {
        title: 'Изменение, отмена и возврат',
        description: 'Сроки и порядок возврата денег',
    },
    {
        title: 'Архив редакций',
        description: 'Прошлые версии всех документов',
    },
];

/** Страница «Реквизиты и контакты» — седьмой документ, ссылка из карточки компании. */
export const LEGAL_REQUISITES = {
    slug: 'requisites',
    href: '/requisites',
    title: 'Реквизиты и контакты',
};

/** Карточка компании на /legal. */
export const LEGAL_COMPANY = {
    name: 'ООО «ТОТУСКЛАБ»',
    inn: '9729424935',
    kpp: '772901001',
    ogrn: '1267700310382',
    address:
        '119361, г. Москва, вн.тер.г. муниципальный округ Очаково-Матвеевское, пер. 2-й Очаковский, д. 4, помещ. 1/2',
    /** Реестровый номер турагента — заполнить после внесения в реестр. */
    touragentRegistry: '[РТА …]',
};
