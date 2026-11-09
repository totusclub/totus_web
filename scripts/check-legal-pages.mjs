// Проверка юридических страниц ООО «ТОТУСКЛАБ» на чистом Node ≥ 22, без npm install:
//   node scripts/check-legal-pages.mjs
// Для каждого из 16 документов (редакция 30.10.2026): есть страница src/pages/<slug>/index.tsx с <CmsStaticPage slug="<slug>" />,
// slug объявлен в типах/defs (getCmsPageDef его находит, SEO и моб. заголовок берутся из defs),
// заголовок страницы — полное название.
// Футер v2 (Figma 2291:105683): из юр. документов в футере только «Правовая информация» (/legal),
// политика обработки персональных данных и пользовательское соглашение в копирайте; все 12 документов —
// ссылки на странице /legal (список в src/config/legalDocs.ts), «Реквизиты и контакты» — последним.
// Пачка 2 (оферта на туры, бронирование размещения, отмена и возврат, памятка, оплата) — только на /legal,
// в футер не выводится. Юр. блок — только ООО «ТОТУСКЛАБ».
// В пользовательских текстах футера, /legal, конфигов и меню профиля нет сокращений вместо «персональных данных»
// и упоминаний стороннего юрлица-продавца номеров (см. FORBIDDEN ниже).
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const read = (rel) => readFileSync(join(root, rel), 'utf8');

// Порядок = порядок на /legal; «Реквизиты и контакты» — последним.
const DOCS = [
    { slug: 'terms', title: 'Пользовательское соглашение', short: 'Пользовательское соглашение' },
    { slug: 'privacy-policy', title: 'Политика обработки персональных данных', short: 'Политика обработки персональных данных' },
    { slug: 'consent', title: 'Согласие на обработку персональных данных', short: 'Согласие на обработку персональных данных' },
    // Редакция 30.10.2026: отдельные согласия и приложения к договору — только на /legal, полные названия.
    { slug: 'personalization-consent', title: 'Согласие на обработку персональных данных для персональных рекомендаций', short: 'Согласие на обработку персональных данных для персональных рекомендаций', pack2: true },
    { slug: 'ads-consent', title: 'Согласие на получение рекламы', short: 'Согласие на рекламу' },
    { slug: 'marketing-data-consent', title: 'Согласие на обработку персональных данных для направления рекламы', short: 'Согласие на обработку персональных данных для направления рекламы', pack2: true },
    { slug: 'cookie-settings', title: 'Политика использования файлов cookie', short: 'Политика cookie' },
    { slug: 'recommendations', title: 'Правила применения рекомендательных технологий', short: 'Рекомендательные технологии' },
    // Пачка 2: полные названия везде, без сокращений (title = currentLabel = mobileHeaderTitle).
    ...[
        ['tour-offer', 'Оферта о заключении договора о реализации туристского продукта'],
        ['booking-application', 'Форма заявки на бронирование туристского продукта'],
        ['operator-information', 'Форма информации о туроператоре'],
        ['hotel-booking', 'Условия бронирования размещения'],
        ['cancellation', 'Изменение, отмена и возврат'],
        ['tourist-memo', 'Памятка туристу'],
        ['payment', 'Оплата и возврат денег'],
    ].map(([slug, title]) => ({ slug, title, short: title, pack2: true })),
    { slug: 'requisites', title: 'Реквизиты и контакты', short: 'Реквизиты и контакты' },
];

let passed = 0;
let failed = 0;
const check = (name, fn) => {
    try {
        fn();
        passed += 1;
        console.log(`ok - ${name}`);
    } catch (e) {
        failed += 1;
        console.log(`FAIL - ${name}\n       ${e && e.message ? e.message : e}`);
    }
};

/** Проверка по regexp с коротким сообщением (assert.match печатает весь файл). */
const has = (text, re, msg) => assert.ok(re.test(text), msg || `не найдено: ${re}`);
const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const footerStatic = read('src/config/footerStaticPages.ts');
const cmsDefs = read('src/config/cmsPageDefs.ts');
const footer = read('src/components/footer/index.tsx');

/** Блок определения страницы: из defs footerStaticPages или EXTRA_DEFS cmsPageDefs. */
function defBlock(slug) {
    const inFooter = footerStatic.match(new RegExp(`\\{\\s*slug:\\s*["']${esc(slug)}["'],[\\s\\S]*?\\n    \\},`));
    if (inFooter) return { file: 'footerStaticPages.ts', text: inFooter[0] };
    const inExtra = cmsDefs.match(new RegExp(`['"]${esc(slug)}['"]:\\s*\\{\\s*slug:\\s*['"]${esc(slug)}['"],[\\s\\S]*?\\n    \\},`));
    if (inExtra) return { file: 'cmsPageDefs.ts', text: inExtra[0] };
    return null;
}

function slugTyped(slug) {
    const union = footerStatic.match(/export type FooterStaticSlug =([\s\S]*?);/);
    if (union && new RegExp(`\\|\\s*["']${esc(slug)}["']`).test(union[1])) return true;
    const cms = cmsDefs.match(/export type CmsPageSlug =([^;]*);/);
    return Boolean(cms && new RegExp(`['"]${esc(slug)}['"]`).test(cms[1]));
}

for (const doc of DOCS) {
    check(`${doc.slug}: страница src/pages/${doc.slug}/index.tsx рендерит CmsStaticPage slug="${doc.slug}"`, () => {
        const rel = `src/pages/${doc.slug}/index.tsx`;
        assert.ok(existsSync(join(root, rel)), `нет файла ${rel}`);
        const src = read(rel);
        has(src, /import \{ CmsStaticPage \} from '@\/components\/staticInfoPage\/CmsStaticPage'/);
        has(src, new RegExp(`<CmsStaticPage slug="${esc(doc.slug)}"\\s*/>`));
        has(src, /export default function/);
    });

    check(`${doc.slug}: slug в типе страниц и в defs (section legal, заголовки, SEO)`, () => {
        assert.ok(slugTyped(doc.slug), 'slug нет в FooterStaticSlug / CmsPageSlug');
        const def = defBlock(doc.slug);
        assert.ok(def, 'нет определения страницы в defs');
        has(def.text, /section:\s*["']legal["']/, 'section должен быть legal');
        has(def.text, new RegExp(`\\btitle:\\s*["']${esc(doc.title)}["']`), `title ≠ «${doc.title}»`);
        has(def.text, new RegExp(`currentLabel:\\s*["']${esc(doc.short)}["']`), `currentLabel ≠ «${doc.short}»`);
        has(def.text, new RegExp(`mobileHeaderTitle:\\s*["']${esc(doc.short)}["']`), `mobileHeaderTitle ≠ «${doc.short}»`);
        has(def.text, /seo:\s*\{[\s\S]*?description:\s*["'][^"']+["'][\s\S]*?keywords:\s*["'][^"']+["']/, 'нет SEO description/keywords');
    });

}

check('privacy-policy: моб. заголовок и SEO маршрута обновлены', () => {
    has(footerStatic, /"privacy-policy":\s*"Политика обработки персональных данных"/);
    const seo = read('src/config/seo.ts');
    has(seo, /'\/privacy-policy':\s*\{\s*title:\s*'Политика обработки персональных данных'/);
});

// ---------------------------------------------------------------- футер v2 и /legal
/** Текст JSX без тегов и {' '}, пробелы схлопнуты. */
const plain = (jsx) => jsx.replace(/\{'\s*'\}/g, ' ').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').replace(/\s+([.,])/g, '$1').trim();
const norm = (t) => t.replace(/\s+/g, ' ').trim();
const footerText = plain(footer);
const footerCss = read('src/components/footer/footer.module.css');
const LEGAL_PAGE = 'src/pages/legal/index.tsx';
const legalPage = existsSync(join(root, LEGAL_PAGE)) ? read(LEGAL_PAGE) : '';

let legalCfg = null;
let legalCfgError = 'нет src/config/legalDocs.ts';
if (existsSync(join(root, 'src/config/legalDocs.ts'))) {
    if (!process.features || !process.features.typescript) {
        legalCfgError = 'нужен Node ≥ 22.18 (type stripping) для загрузки legalDocs.ts';
    } else {
        try {
            legalCfg = await import(pathToFileURL(join(root, 'src/config/legalDocs.ts')).href);
        } catch (e) {
            legalCfgError = `legalDocs.ts не загрузился: ${e && e.message ? e.message : e}`;
        }
    }
}
const cfg = () => {
    assert.ok(legalCfg, legalCfgError);
    return legalCfg;
};

// Тексты, которые видит пользователь: футер, /legal, конфиги юр. страниц, SEO, меню профиля.
const USER_TEXT_FILES = [
    ...DOCS.map((d) => `src/pages/${d.slug}/index.tsx`),
    'src/components/footer/index.tsx',
    'src/components/footer/footer.module.css',
    'src/pages/legal/index.tsx',
    'src/components/legalPage/legalPage.module.css',
    'src/config/legalDocs.ts',
    'src/config/footerStaticPages.ts',
    'src/config/cmsPageDefs.ts',
    'src/config/seo.ts',
    'src/components/profile/menu.tsx',
];
// Собрано из частей, чтобы сам скрипт не содержал запрещённых слов целиком.
const FORBIDDEN = [
    { name: 'сокращение «ПД' + 'н»', re: new RegExp('ПД' + 'н') },
    { name: 'юрлицо-продавец номеров', re: new RegExp(['Арлеки' + 'нотур', 'АРЛЕКИ' + 'НОТУР', 'Arle' + 'kino'].join('|'), 'i') },
    { name: 'адрес прежнего юрлица', re: new RegExp('Малая ' + 'Очаковская') },
];

for (const f of FORBIDDEN) {
    check(`нет «${f.name}» в футере, /legal, конфигах, SEO и меню профиля`, () => {
        const hits = [];
        for (const rel of USER_TEXT_FILES) {
            assert.ok(existsSync(join(root, rel)), `нет файла ${rel}`);
            read(rel).split('\n').forEach((line, i) => {
                if (f.re.test(line)) hits.push(`${rel}:${i + 1}: ${line.trim().slice(0, 80)}`);
            });
        }
        assert.deepEqual(hits, [], `найдено:\n       ${hits.join('\n       ')}`);
    });
}

check('меню профиля: пункт «Политика обработки персональных данных» ведёт на /privacy-policy', () => {
    const menu = read('src/components/profile/menu.tsx');
    has(menu, /router\.push\('\/privacy-policy'\)[\s\S]{0,200}<p>Политика обработки персональных данных<\/p>/);
});

check('футер: колонка «Приложение Totus Club» со сторами и «Будьте с нами» с соцсетями', () => {
    has(footerText, /Приложение Totus Club/);
    has(footerText, /Будьте с нами/);
    for (const icon of ['appStore', 'googlePlay', 'ruStore']) has(footer, new RegExp(`name=\\{'${icon}'\\}`), `нет иконки ${icon}`);
    has(footer, /getFooterSocialLinks\(\)/, 'соцсети должны браться из /api/footer-social');
    has(footer, /<SocialLinks items=\{socialLinks\} \/>/);
});

// 14.10.2026: «Советы по низким тарифам» и «Безопасность» убраны из футера по решению владельца
// (страницы /low-fare-tips и /security остаются доступны по адресу).
check('футер: «Компания» — 4 ссылки, «Помощь» — 2 ссылки', () => {
    const company = [['/about-us', 'О нас'], ['/partners', 'Партнёры'], ['/advertise', 'Рекламируйтесь у нас'], ['/requisites', 'Реквизиты и контакты']];
    const help = [['/help-faq', 'Помощь и FAQ'], ['/airlines', 'Авиакомпании']];
    const block = (name) => {
        const m = footer.match(new RegExp(`const ${name} = \\[([\\s\\S]*?)\\];`));
        assert.ok(m, `нет ${name}`);
        return m[1];
    };
    for (const [name, links] of [['COMPANY_LINKS', company], ['HELP_LINKS', help]]) {
        const b = block(name);
        const found = [...b.matchAll(/href: '([^']+)', label: '([^']+)'/g)].map((x) => [x[1], x[2]]);
        assert.deepEqual(found, links, name);
    }
    for (const gone of ['/low-fare-tips', '/security', 'Советы по низким тарифам', 'Безопасность']) {
        assert.ok(!footer.includes(gone), `в футере осталось «${gone}»`);
    }
    has(footer, /<LinkColumn title="Компания" links=\{COMPANY_LINKS\}/);
    has(footer, /<LinkColumn title="Помощь" links=\{HELP_LINKS\}/);
});

check('футер: юридический блок ООО «ТОТУСКЛАБ» (ИНН 9729424935) с текстом из макета', () => {
    const lines = [
        'Турагент: ООО «ТОТУСКЛАБ», ИНН 9729424935, ОГРН 1267700310382, 119361, г. Москва, вн.тер.г. муниципальный округ Очаково-Матвеевское, пер. 2-й Очаковский, д. 4, помещ. 1/2.',
        'Приём платежей: Банк ВТБ (ПАО)',
        'Информация на сайте носит справочный характер. Условия проживания в отелях, в том числе концепция питания, могут изменяться по решению администрации отелей. Сумма, отображаемая на сайте, включает стоимость туристского продукта. Копирование материалов без письменного согласия запрещено.',
    ];
    for (const line of lines) assert.ok(footerText.includes(line), `нет строки: ${line.slice(0, 60)}…`);
    // 14.10.2026: номер реестра — только из настройки сайта, заглушки «[РТА …]» на боевом сайте нет.
    assert.ok(!/\[РТА/.test(footer), 'в подвале заглушка номера реестра');
    has(footer, /\{LEGAL_COMPANY\.touragentRegistry \? ` Реестровый номер турагента: \$\{LEGAL_COMPANY\.touragentRegistry\}` : null\}/);
    has(footer, /<div className=\{styles\.legalBlock\}>/);
    for (const icon of ['mir', 'visa']) has(footer, new RegExp(`name=\\{'${icon}'\\}`), `нет значка оплаты ${icon}`);
    has(footerCss, /\.legalBlock\{[\s\S]*?flex: 0 1 400px;/, 'ширина юр. блока ~400px');
    has(footerCss, /\.legalText\{[\s\S]*?font-size: 13px;[\s\S]*?line-height: 18px;/, 'юр. текст 13/18');
});

check('футер: из юр. документов только /legal, /privacy-policy и /terms (в копирайте)', () => {
    has(footer, /<Link href="\/legal" className=\{styles\.legalLinkMain\}>Правовая информация<\/Link>/);
    has(footer, /<Link href="\/privacy-policy" className=\{styles\.legalLink\}>Политика обработки персональных данных<\/Link>/);
    const pack2 = DOCS.filter((d) => d.pack2).map((d) => d.slug);
    for (const slug of ['consent', 'ads-consent', 'cookie-settings', 'recommendations', 'badges-certificates', ...pack2]) {
        assert.ok(!footer.includes(`"/${slug}"`), `в футере осталась ссылка /${slug} (теперь она на /legal)`);
    }
    assert.ok(!/footerBottomLink/.test(footer), 'строка из 7 документов внизу футера должна быть убрана');
    for (const d of DOCS.filter((x) => x.pack2)) {
        assert.ok(!footer.includes(d.title), `в футере название «${d.title}» (документы пачки 2 — только на /legal)`);
    }
});

check('футер: копирайт-строка целиком, ссылки на соглашение и политику обработки персональных данных', () => {
    const m = footer.match(/<p className=\{styles\.copyright\}>([\s\S]*?)<\/p>/);
    assert.ok(m, 'нет <p className={styles.copyright}>');
    assert.equal(
        plain(m[1]),
        '© 2026 ООО «ТОТУСКЛАБ». Все права защищены. Используя сайт, вы принимаете условия пользовательского соглашения. Информация на сайте не является публичной офертой, кроме документов в разделе «Правовая информация». Политика обработки персональных данных. Настройки cookie',
    );
    // «кроме документов…»: оферта на туры и условия бронирования на /legal — публичные оферты (14.10.2026).
    has(m[1], /<Link href="\/legal">«Правовая информация»<\/Link>/);
    has(m[1], /<button type="button" className=\{styles\.cookieSettings\} onClick=\{openCookieSettings\}>/);
    has(m[1], /<Link href="\/terms">пользовательского соглашения<\/Link>/);
    has(m[1], /<Link href="\/privacy-policy">Политика обработки персональных данных<\/Link>/);
    has(footerCss, /\.copyright a\{[\s\S]*?text-decoration: underline;/, 'ссылки в копирайте подчёркнуты');
});

check('футер: мобильная версия — столбиком и с отступом под нижнюю панель', () => {
    has(footerCss, /@media \(max-width: 1024px\)[\s\S]*padding-bottom: calc\(60px \+ env\(safe-area-inset-bottom\)\);/);
    has(footerCss, /@media \(max-width: 1024px\)[\s\S]*\.footerRow\{\s*flex-direction: column;/);
});

check('legalDocs.ts: ровно 16 опубликованных документов, реквизиты — последним', () => {
    const { LEGAL_DOCS, LEGAL_REQUISITES, LEGAL_COMPANY } = cfg();
    assert.equal(LEGAL_DOCS.length, 16);
    assert.deepEqual(LEGAL_DOCS.map((d) => d.slug), DOCS.map((d) => d.slug), 'порядок/набор документов ≠ 16 юр. страниц');
    assert.equal(LEGAL_DOCS[LEGAL_DOCS.length - 1], LEGAL_REQUISITES, 'последний пункт — «Реквизиты и контакты»');
    assert.equal(LEGAL_REQUISITES.description, 'Реквизиты ООО «ТОТУСКЛАБ» и контакты поддержки');
    for (const d of LEGAL_DOCS) {
        const ref = DOCS.find((x) => x.slug === d.slug);
        assert.equal(d.title, ref.title, `${d.slug}: название ≠ заголовку страницы`);
        assert.equal(d.href, `/${d.slug}`);
        assert.ok(existsSync(join(root, `src/pages/${d.slug}/index.tsx`)), `нет страницы ${d.href}`);
        assert.ok(d.description && d.description.length > 10, `${d.slug}: нет описания`);
    }
    const pack2Desc = {
        'tour-offer': 'Условия покупки тура: заявка, цена и оплата, права сторон, отмена, претензии',
        'hotel-booking': 'Бронирование отелей без перелёта: подтверждение, оплата, заселение, отмена',
        cancellation: 'Как изменить или отменить тур и бронирование, сроки возврата денег',
        'tourist-memo': 'Документы, визы, страхование, аэропорт, что делать на месте, важные контакты',
        payment: 'Способы оплаты, кассовый чек, возврат денег, безопасность платежей',
    };
    for (const [slug, desc] of Object.entries(pack2Desc)) {
        assert.equal(LEGAL_DOCS.find((d) => d.slug === slug)?.description, desc, `${slug}: описание на /legal`);
    }
    assert.equal(LEGAL_COMPANY.inn, '9729424935');
    assert.equal(LEGAL_COMPANY.kpp, '772901001');
    assert.equal(LEGAL_COMPANY.ogrn, '1267700310382');
});

check('/legal: страница существует, шаблон StaticInfoPage (section legal), заголовок и подзаголовок', () => {
    assert.ok(legalPage, `нет файла ${LEGAL_PAGE}`);
    has(legalPage, /import \{ StaticInfoPage \} from '@\/components\/staticInfoPage'/);
    has(legalPage, /<StaticInfoPage title="Правовая информация" section="legal" currentLabel="Правовая информация">/);
    assert.ok(norm(legalPage).includes('Документы, на условиях которых работает сервис Totus Club, и реквизиты компании.'), 'нет подзаголовка');
    has(legalPage, /export default function/);
});

check('/legal: все 16 документов — ссылки из конфига', () => {
    has(legalPage, /from '@\/config\/legalDocs'/);
    has(legalPage, /\{LEGAL_DOCS\.map\(\(doc\) => \([\s\S]*?<Link href=\{doc\.href\}/, 'LEGAL_DOCS → <Link href={doc.href}>');
    assert.equal((legalPage.match(/\.map\(/g) || []).length, 1, 'на странице один список — LEGAL_DOCS');
    has(legalPage, />Пользователям</);
});

check('/legal: нет «Скоро», «Готовятся» и неопубликованных документов (боевой сайт)', () => {
    const cfgSrc = existsSync(join(root, 'src/config/legalDocs.ts')) ? read('src/config/legalDocs.ts') : '';
    assert.ok(legalPage && cfgSrc, 'нет страницы /legal или legalDocs.ts');
    const css = read('src/components/legalPage/legalPage.module.css');
    for (const [name, text] of [['страница', legalPage], ['конфиг', cfgSrc], ['CSS', css]]) {
        assert.ok(!/Скоро|Готовятся|UPCOMING|upcoming|itemMuted|\.soon\b/.test(text), `${name}: остались «Скоро»/«Готовятся»/приглушённые строки`);
    }
    const exported = Object.keys(cfg());
    assert.deepEqual(exported.sort(), ['LEGAL_COMPANY', 'LEGAL_DOCS', 'LEGAL_REQUISITES'], 'в конфиге лишние экспорты');
});

check('/legal: карточка ООО «ТОТУСКЛАБ» со ссылкой «Все реквизиты и контакты →» на /requisites', () => {
    for (const f of ['LEGAL_COMPANY.inn', 'LEGAL_COMPANY.kpp', 'LEGAL_COMPANY.ogrn', 'LEGAL_COMPANY.address', 'LEGAL_COMPANY.touragentRegistry']) {
        assert.ok(legalPage.includes(`{${f}}`), `нет ${f}`);
    }
    // Строка «Реестр турагентов» — только когда номер задан в NEXT_PUBLIC_TOURAGENT_REGISTRY_NUMBER.
    has(legalPage, /\{LEGAL_COMPANY\.touragentRegistry \? \(/);
    assert.ok(!/\[РТА/.test(read('src/config/legalDocs.ts')), 'заглушка номера реестра в legalDocs.ts');
    has(legalPage, /<Link href=\{LEGAL_REQUISITES\.href\}[^>]*>\s*Все реквизиты и контакты →\s*<\/Link>/);
});

check('/legal: SEO маршрута и мобильный заголовок', () => {
    const seo = read('src/config/seo.ts');
    has(seo, /'\/legal':\s*\{\s*title:\s*'Правовая информация'/);
    has(footerStatic, /\blegal:\s*"Правовая информация"/);
});

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed ? 1 : 0);
