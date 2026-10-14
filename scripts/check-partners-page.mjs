// Страница /partners и форма «Стать партнёром» (макет Figma «Партнёры», 14.10.2026).
// Node ≥ 22, без npm install: node scripts/check-partners-page.mjs
// Заявка уходит в totus_API (POST /api/partner-requests) и видна в админке, раздел «Заявки партнёров».
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const read = (rel) => readFileSync(join(root, rel), 'utf8');

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

const page = read('src/pages/partners/index.tsx');
const content = read('src/components/infoPages/PartnersContent.tsx');
const api = read('src/api/partnerRequestApi.ts');
const css = read('src/components/infoPages/infoPages.module.css');

check('страница: шаблон StaticInfoPage (plain), крошки «О компании › Партнёры», SEO, без CMS', () => {
    assert.ok(!/CmsStaticPage/.test(page));
    assert.match(page, /import \{ PartnersContent \} from '@\/components\/infoPages\/PartnersContent'/);
    assert.match(page, /breadcrumbMid="О компании"/);
    assert.match(page, /\n\s+plain\n/);
    assert.match(page, /<title>\{def\.seo\.title\}<\/title>/);
    assert.match(page, /FOOTER_STATIC_BY_SLUG\['partners'\]/);
});

check('блоки макета: h1, якоря, туроператоры из /api/home-partners, ВТБ, «Стать партнёром»', () => {
    for (const s of [
        'Партнёры Totus Club', 'partners-operators', 'partners-payments', 'partners-join', 'getHomePartners()',
        'Anex', 'Интурист', 'ICS Travel', 'Банк ВТБ (ПАО)', 'Систему быстрых платежей', 'Стать партнёром Totus Club',
        'Туроператорам', 'Отелям', 'Рекламодателям',
    ]) assert.ok(content.includes(s), `нет «${s}»`);
    assert.ok(!/Level\.?\s?Travel/i.test(content), 'Level.Travel не упоминается (решение владельца)');
});

check('форма: поля и типы как в API, проверка до отправки, ловушка для ботов, согласие со ссылкой', () => {
    for (const k of ['company', 'name', 'email', 'phone', 'message']) {
        assert.ok(content.includes(`'${k}'`), `нет поля ${k}`);
    }
    for (const k of ["'operator'", "'hotel'", "'ads'", "'other'"]) assert.ok(content.includes(k), k);
    assert.match(content, /role="radiogroup" aria-label="Кто вы"/);
    assert.match(content, /const found = validatePartnerForm\(fields\);/);
    assert.match(content, /name="website"[\s\S]*?tabIndex=\{-1\}[\s\S]*?className=\{styles\.honeypot\}/);
    assert.match(content, /href="\/privacy-policy"/);
    assert.ok(content.includes('Политикой обработки персональных данных'));
    assert.match(content, /role="alert"/, 'ошибка сервера показывается в форме, не alert()');
    assert.ok(!/\balert\(/.test(content));
    assert.ok(content.includes('Заявка отправлена'));
});

check('API: POST /api/partner-requests с JSON, текст ошибки сервера пользователю', () => {
    assert.match(api, /import \{ API_BASE_URL \} from '@\/config\/api';/);
    assert.ok(api.includes('`${API_BASE_URL}/api/partner-requests`'));
    assert.match(api, /method: 'POST'/);
    assert.match(api, /'Content-Type': 'application\/json'/);
    assert.match(api, /throw new Error\(data\?\.message \|\| /);
});

check('проверка формы совпадает с сервером (почта, телефон 10–15 цифр, 2000 символов)', () => {
    // Те же правила, что validatePartnerRequest в totus_API.
    const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
    assert.ok(content.includes(String(EMAIL_RE)));
    assert.match(content, /digits\.length < 10 \|\| digits\.length > 15/);
    assert.match(content, /export const MESSAGE_MAX = 2000;/);
    assert.match(content, /f\.company\.trim\(\)\.length < 2/);
    assert.match(content, /f\.name\.trim\(\)\.length < 2/);
});

check('стили: телефон в одну колонку, логотипы 2 в ряд, тёмная тема для логотипов', () => {
    assert.match(css, /\.partnerLogos \{[\s\S]*?repeat\(auto-fit, minmax\(160px, 1fr\)\)/);
    assert.match(css, /@media \(max-width: 768px\) \{[\s\S]*?\.formRow \{\s*grid-template-columns: minmax\(0, 1fr\);/);
    assert.match(css, /\[data-theme='dark'\] \.partnerLogo img/);
    assert.match(css, /\.joinCard \{\s*flex-direction: column;/);
});

// Собрано из частей, чтобы сам скрипт не содержал запрещённых слов целиком.
const FORBIDDEN = [new RegExp('ПД' + 'н'), new RegExp(['Арлеки' + 'нотур', 'Arle' + 'kino'].join('|'), 'i'), /Скоро/];
check('нет сокращения вместо «персональных данных», стороннего юрлица и «Скоро»', () => {
    const hits = [];
    for (const [rel, text] of [['page', page], ['content', content], ['api', api]]) {
        text.split('\n').forEach((line, i) => {
            if (FORBIDDEN.some((re) => re.test(line))) hits.push(`${rel}:${i + 1}`);
        });
    }
    assert.deepEqual(hits, []);
});

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed ? 1 : 0);
