// Проверка юридических страниц ООО «ТОТУСКЛАБ» на чистом Node ≥ 22, без npm install:
//   node scripts/check-legal-pages.mjs
// Для каждого из 7 документов: есть страница src/pages/<slug>/index.tsx с <CmsStaticPage slug="<slug>" />,
// slug объявлен в типах/defs (getCmsPageDef его находит, SEO и моб. заголовок берутся из defs),
// в футере есть ссылка /<slug> с коротким названием документа, заголовок страницы — полное название.
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const read = (rel) => readFileSync(join(root, rel), 'utf8');

const DOCS = [
    { slug: 'terms', title: 'Пользовательское соглашение', short: 'Пользовательское соглашение' },
    { slug: 'privacy-policy', title: 'Политика обработки персональных данных', short: 'Политика обработки ПДн' },
    { slug: 'consent', title: 'Согласие на обработку персональных данных', short: 'Согласие на обработку ПДн' },
    { slug: 'ads-consent', title: 'Согласие на получение рекламы', short: 'Согласие на рекламу' },
    { slug: 'cookie-settings', title: 'Политика использования файлов cookie', short: 'Политика cookie' },
    { slug: 'recommendations', title: 'Правила применения рекомендательных технологий', short: 'Рекомендательные технологии' },
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

    check(`${doc.slug}: в футере ссылка /${doc.slug} «${doc.short}»`, () => {
        const link = new RegExp(`<Link href="/${esc(doc.slug)}"[^>]*>\\s*${esc(doc.short)}\\s*</Link>`);
        has(footer, link, `нет <Link href="/${doc.slug}">${doc.short}</Link>`);
    });
}

check('все 7 названий документов есть в футере', () => {
    const missing = DOCS.filter((d) => !footer.includes(d.short)).map((d) => d.short);
    assert.deepEqual(missing, []);
});

check('privacy-policy: моб. заголовок и SEO маршрута обновлены', () => {
    has(footerStatic, /"privacy-policy":\s*"Политика обработки ПДн"/);
    const seo = read('src/config/seo.ts');
    has(seo, /'\/privacy-policy':\s*\{\s*title:\s*'Политика обработки персональных данных'/);
});

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed ? 1 : 0);
