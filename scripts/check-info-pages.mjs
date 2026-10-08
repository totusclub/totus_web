// Проверка страниц «О нас», «Частые вопросы», «Авиакомпании» на чистом Node ≥ 22, без npm install:
//   node scripts/check-info-pages.mjs
// Макеты: Figma, страницы О нас / FAQ / Авиакомпании (08.10.2026). Контент — в коде, не из CMS.
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const read = (rel) => readFileSync(join(root, rel), 'utf8');
const has = (text, re, msg) => assert.ok(re.test(text), msg || `не найдено: ${re}`);

let passed = 0;
let failed = 0;
const check = async (name, fn) => {
    try {
        await fn();
        passed += 1;
        console.log(`ok - ${name}`);
    } catch (e) {
        failed += 1;
        console.log(`FAIL - ${name}\n       ${e && e.message ? e.message : e}`);
    }
};

const load = async (rel) => {
    assert.ok(process.features && process.features.typescript, 'нужен Node ≥ 22.18 (type stripping)');
    return import(pathToFileURL(join(root, rel)).href);
};

const PAGES = [
    ['about-us', 'AboutContent'],
    ['help-faq', 'FaqContent'],
    ['airlines', 'AirlinesContent'],
];

for (const [slug, comp] of PAGES) {
    await check(`${slug}: страница на шаблоне StaticInfoPage с контентом ${comp}`, () => {
        const rel = `src/pages/${slug}/index.tsx`;
        assert.ok(existsSync(join(root, rel)), `нет файла ${rel}`);
        const src = read(rel);
        has(src, /import \{ StaticInfoPage \} from '@\/components\/staticInfoPage'/);
        has(src, new RegExp(`import \\{ ${comp} \\} from '@/components/infoPages/${comp}'`));
        has(src, new RegExp(`<${comp} />`));
        assert.ok(!/CmsStaticPage/.test(src), 'страница больше не берёт текст из CMS');
        has(src, /<title>\{def\.seo\.title\}<\/title>/, 'нет SEO title');
    });
}

await check('about-us: крошки «Главная › О компании › О нас», реквизиты ООО «ТОТУСКЛАБ»', () => {
    const defs = read('src/config/cmsPageDefs.ts');
    has(defs, /'about-us':[\s\S]*?currentLabel: 'О нас',[\s\S]*?breadcrumbMid: 'О компании'/);
    const about = read('src/components/infoPages/AboutContent.tsx');
    for (const s of ['ИНН / КПП: 9729424935 / 772901001', 'ОГРН: 1267700310382', '«Правовая информация»', 'А также:']) {
        assert.ok(about.includes(s), `нет «${s}»`);
    }
    has(about, /href="\/legal"/);
    has(about, /getHomePartners\(\)/, 'логотипы туроператоров — из /api/home-partners');
    has(about, /'\/about\/couple\.webp'/);
    has(about, /'\/about\/friends\.webp'/);
});

await check('help-faq: 5 групп, 20 вопросов, ссылка в чат поддержки', async () => {
    const { FAQ_GROUPS } = await load('src/config/faqContent.ts');
    assert.equal(FAQ_GROUPS.length, 5);
    assert.deepEqual(FAQ_GROUPS.map((g) => g.items.length), [6, 4, 3, 3, 4]);
    const qs = FAQ_GROUPS.flatMap((g) => g.items.map((i) => i.q));
    assert.equal(new Set(qs).size, 20, 'вопросы не должны повторяться');
    for (const g of FAQ_GROUPS) for (const i of g.items) assert.ok(i.a.length > 0, `пустой ответ: ${i.q}`);
    const page = read('src/pages/help-faq/index.tsx');
    has(page, /title="Частые вопросы"/);
    has(read('src/components/infoPages/FaqContent.tsx'), /href="\/profile\/support-chat"/);
});

await check('airlines: 17 российских и 27 зарубежных, коды IATA уникальны', async () => {
    const { RUSSIAN_AIRLINES, FOREIGN_AIRLINES, BEFORE_FLIGHT_TIPS } = await load('src/config/airlinesContent.ts');
    assert.equal(RUSSIAN_AIRLINES.length, 17);
    assert.equal(FOREIGN_AIRLINES.length, 27);
    const codes = [...RUSSIAN_AIRLINES, ...FOREIGN_AIRLINES].map((r) => r[0]);
    assert.equal(new Set(codes).size, codes.length, 'повтор кода IATA');
    for (const c of codes) assert.match(c, /^[A-Z0-9]{2}$/);
    assert.deepEqual(BEFORE_FLIGHT_TIPS.map((t) => t.title), ['Багаж', 'Регистрация', 'Изменение рейса']);
    has(read('src/components/infoPages/AirlinesContent.tsx'), /onError=\{\(\) => setFailed\(true\)\}/, 'запасной вариант — код IATA');
});

await check('about-us: фото лежат в репозитории (base64) и раскладываются в public/about перед сборкой', async () => {
    const { decodeB64File } = await import(pathToFileURL(join(root, 'scripts/decode-about-photos.mjs')).href);
    for (const name of ['couple', 'friends']) {
        const buf = decodeB64File(join(root, `src/assets/about/${name}.webp.b64`));
        assert.ok(buf.length > 20000, `${name}.webp слишком маленький`);
    }
    const pkg = JSON.parse(read('package.json'));
    assert.equal(pkg.scripts.prebuild, 'node scripts/decode-about-photos.mjs');
    assert.equal(pkg.scripts.predev, 'node scripts/decode-about-photos.mjs');
});

await check('_app: Header и Footer есть на /airlines и /airline-fees (скрыты только на /ai и /ai/*)', () => {
    const app = read('src/pages/_app.tsx');
    assert.ok(!/startsWith\('\/ai'\)/.test(app), "startsWith('/ai') ловит и /airlines");
    has(app, /pathname === '\/ai' \|\| router\.pathname\.startsWith\('\/ai\/'\)/);
    const isAi = (p) => p === '/ai' || p.startsWith('/ai/');
    for (const p of ['/airlines', '/airline-fees', '/about-us', '/help-faq']) assert.equal(isAi(p), false, p);
    for (const p of ['/ai', '/ai/tours/[id]']) assert.equal(isAi(p), true, p);
});

const FILES = [
    ...PAGES.map(([s]) => `src/pages/${s}/index.tsx`),
    'src/components/infoPages/AboutContent.tsx',
    'src/components/infoPages/FaqContent.tsx',
    'src/components/infoPages/AirlinesContent.tsx',
    'src/config/faqContent.ts',
    'src/config/airlinesContent.ts',
];
// Собрано из частей, чтобы сам скрипт не содержал запрещённых слов целиком.
const FORBIDDEN = [
    new RegExp('ПД' + 'н'),
    new RegExp(['Арлеки' + 'нотур', 'АРЛЕКИ' + 'НОТУР', 'Arle' + 'kino'].join('|'), 'i'),
];
await check('нет сокращения вместо «персональных данных» и стороннего юрлица', () => {
    const hits = [];
    for (const rel of FILES) {
        read(rel).split('\n').forEach((line, i) => {
            if (FORBIDDEN.some((re) => re.test(line))) hits.push(`${rel}:${i + 1}`);
        });
    }
    assert.deepEqual(hits, []);
});

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed ? 1 : 0);
