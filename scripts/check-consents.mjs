// Согласия под формами сайта (макет «Согласия в формах», утверждён 14.10.2026).
// Node ≥ 22.18, без npm install: node scripts/check-consents.mjs
// Журнал согласий на сервере — totus_API, docs/CONSENTS_API.md.
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

const ui = read('src/components/UI/consentCheckbox/index.tsx');
const uiCss = read('src/components/UI/consentCheckbox/consentCheckbox.module.css');
const callback = read('src/components/home/callRequest.tsx');
const callbackApi = read('src/api/callbackRequestApi.ts');
const signup = read('src/components/auth/signup.tsx');
const signin = read('src/components/auth/signin.tsx');
const yandex = read('src/pages/auth/yandex.tsx');
const card = read('src/components/bookingPage/orderCard.tsx');
const booking = read('src/components/bookingPage/index.tsx');
const partners = read('src/components/infoPages/PartnersContent.tsx');
const partnersApi = read('src/api/partnerRequestApi.ts');
const banner = read('src/components/cookieConsent/index.tsx');
const app = read('src/pages/_app.tsx');
const footer = read('src/components/footer/index.tsx');

await check('ссылки: все документы под формами — опубликованные страницы сайта', async () => {
    const { LEGAL_LINKS, hasRequiredConsents } = await load('src/config/legalLinks.ts');
    for (const [key, href] of Object.entries(LEGAL_LINKS)) {
        assert.match(href, /^\/[a-z-]+$/, key);
        assert.ok(existsSync(join(root, `src/pages${href}/index.tsx`)), `нет страницы ${href}`);
    }
    assert.equal(hasRequiredConsents({ pd: true, tour_offer: true }, ['tour_offer', 'pd']), true);
    assert.equal(hasRequiredConsents({ pd: true, ads: true }, ['tour_offer', 'pd']), false);
    assert.equal(hasRequiredConsents({ pd: 'true' }, ['pd']), false, 'только настоящее true');
});

await check('тексты согласий как в макете, ссылки в новой вкладке', () => {
    for (const s of [
        'согласие на обработку персональных данных</DocLink>',
        'Политикой обработки персональных данных</DocLink>',
        ', в том числе данных туристов, указанных в заказе, — с их согласия,',
        ', в том числе данных гостей, указанных в заказе, — с их согласия,',
        'Хочу получать спецпредложения и новости Totus Club.',
        'Согласие на получение рекламы</DocLink>',
        'Оферту о заключении договора о реализации туристского продукта</DocLink>',
        'изменения, отмены и возврата</DocLink>',
        'Памятку туристу</DocLink> и сведения о туроператоре в заказе',
        'Условия бронирования размещения</DocLink>',
        'правила отмены выбранного тарифа и условия',
        'Пользовательское соглашение</DocLink>',
    ]) assert.ok(ui.includes(s), `нет «${s}»`);
    has(ui, /<a href=\{href\} target="_blank" rel="noopener noreferrer"/);
    for (const k of ['consent', 'privacy', 'adsConsent', 'tourOffer', 'cancellation', 'payment', 'touristMemo', 'hotelBooking', 'terms']) {
        assert.ok(ui.includes(`LEGAL_LINKS.${k}`), `нет ссылки ${k}`);
    }
    has(ui, /type="checkbox"/);
    assert.ok(!/defaultChecked/.test(ui), 'чекбоксы не отмечены заранее');
    has(uiCss, /\.onAccent \.box:checked \{[^}]*background: #141414;/, 'на оранжевом — тёмная галочка');
});

await check('обратный звонок: обязательный чекбокс, без него кнопка неактивна, согласие уходит с номером', () => {
    has(callback, /const \[pdConsent, setPdConsent\] = useState\(false\);/);
    has(callback, /const isValid = phoneValid && pdConsent;/);
    has(callback, /<ConsentCheckbox id="callback-consent-pd" checked=\{pdConsent\} onChange=\{setPdConsent\} variant="onAccent" required>\s*<ConsentPdText \/>/);
    has(callback, /submitCallbackRequest\(phone, \{ pd: true \}\)/);
    has(callback, /Отметьте согласие, чтобы отправить номер/);
    has(callbackApi, /body: JSON\.stringify\(\{ phone, consents \}\)/);
    assert.ok(!/условиями оферты|Нажимая кнопку/.test(callback));
});

await check('регистрация: согласие обязательно, реклама — нет; «Регистрируясь…»; текста про звонок и тарифы нет', () => {
    has(signup, /const \[pdConsent, setPdConsent\] = useState\(false\);/);
    has(signup, /const \[adsConsent, setAdsConsent\] = useState\(false\);/);
    has(signup, /Boolean\(params\.phone\?\.trim\(\)\) &&\s*pdConsent;/);
    assert.ok(!/adsConsent;/.test(signup.slice(signup.indexOf('const formReady'), signup.indexOf('const disabled'))), 'реклама не влияет на кнопку');
    has(signup, /consents: \{ pd: true, ads: adsConsent \}/);
    has(signup, /<TermsNote verb="Регистрируясь" \/>/);
    for (const f of [signup, signin]) assert.ok(!/Мы позвоним|стандартные тарифы/.test(f));
});

await check('вход: «Пришлём код на почту.», под кнопками соглашение и политика', () => {
    has(signin, /<p>Пришлём код на почту\.<\/p>/);
    has(signin, /<YandexIdButton \/>\s*<TermsNote verb="Продолжая" withPrivacy \/>/);
});

await check('Яндекс ID, новый пользователь: шаг согласия, «Продолжить» с телефоном или без, «Отказаться и выйти»', () => {
    has(yandex, /type Stage = 'loading' \| 'phone' \| 'consent' \| 'error';/);
    has(yandex, /if \(data\.isNew\) \{\s*setStage\('consent'\);/);
    has(yandex, /await saveConsents\('signup_yandex', \{ pd: true, ads: adsConsent \}\)/);
    has(yandex, /disabled=\{!pdConsent \|\| saving\}/);
    has(yandex, /if \(phone\.trim\(\)\) \{/, 'телефон необязателен');
    has(yandex, /deleteToken\(\);\s*dispatch\(logout\(\)\);/);
    has(yandex, />\s*Отказаться и выйти\s*</);
    has(yandex, /Телефон можно\s+добавить позже\./);
    has(read('src/api/consentsApi.ts'), /axios\.post\(`\$\{API_BASE_URL\}\/api\/consents`, \{ form, consents \}\)/);
});

await check('бронирование: тур — оферта, отель — условия размещения; оба обязательны с согласием; «Отель в …»', async () => {
    has(card, /return isHotelOnly \? \['hotel_terms', 'pd'\] : \['tour_offer', 'pd'\];/);
    has(card, /<ConsentHotelTermsText \/>/);
    has(card, /<ConsentTourOfferText \/>/);
    has(card, /<ConsentPdText subjects=\{isHotelOnly \? 'guests' : 'tourists'\} \/>/);
    has(card, /<ConsentAdsText \/>/);
    has(card, /disabled=\{!isFormValid \|\| !consentsOk \|\| loading( \|\| submitUnavailable)?\}/);
    has(card, /Отметьте обязательные пункты, чтобы продолжить/);
    has(card, /\{isHotelOnly \? 'Отель' : 'Тур'\} в \{packageData\?\.hotel\?\.city\}/);
    assert.ok(!/перс\. данным|Условиями продажи|потреб\./.test(card), 'старый текст убран (в обоих состояниях)');
    has(booking, /const \[consents, setConsents\] = useState<Consents>\(\{\}\);/);
    has(booking, /const isHotelOnly = isHotelOnlySearch\(getSearchTypeFromQuery\(router\.query\)\);/);
    has(booking, /\? \{ hotel_terms: true, pd: true, ads: consents\.ads === true \}\s*: \{ tour_offer: true, pd: true, ads: consents\.ads === true \}/);
    has(booking, /if \(!consentsOk\) \{\s*return;\s*\}/);
    has(booking, /isHotelOnly=\{isHotelOnly\}\s*consents=\{consents\}\s*onConsentsChange=\{setConsents\}/);
});

await check('партнёры: отдельный чекбокс согласия, без него заявка не отправляется', () => {
    has(partners, /const \[pdConsent, setPdConsent\] = useState\(false\);/);
    has(partners, /if \(sending \|\| !pdConsent\) return;/);
    has(partners, /consents: \{ pd: true \}/);
    has(partnersApi, /consents: Consents;/);
    assert.ok(!/Нажимая кнопку/.test(partners));
});

await check('cookie: выбор хранится 12 месяцев, старое «accepted» не считается, версия баннера', async () => {
    const c = await load('src/utils/cookieConsent.ts');
    const now = Date.UTC(2026, 9, 14);
    const ok = JSON.stringify({ v: c.COOKIE_CONSENT_VERSION, analytics: true, at: now - 1000 });
    assert.deepEqual(c.parseCookieChoice(ok, now), { v: c.COOKIE_CONSENT_VERSION, analytics: true, at: now - 1000 });
    assert.equal(c.parseCookieChoice('accepted', now), null, 'согласие «продолжая пользоваться» — спросить заново');
    assert.equal(c.parseCookieChoice(null, now), null);
    assert.equal(c.parseCookieChoice(JSON.stringify({ v: 1, analytics: true, at: now }), now), null, 'старая версия текста');
    assert.equal(c.parseCookieChoice(JSON.stringify({ v: c.COOKIE_CONSENT_VERSION, analytics: true, at: now - c.COOKIE_CONSENT_TTL_MS - 1 }), now), null, 'старше 12 месяцев');
    assert.equal(c.parseCookieChoice(JSON.stringify({ v: c.COOKIE_CONSENT_VERSION, analytics: 'yes', at: now }), now), null);
    assert.equal(c.COOKIE_CONSENT_TTL_MS, 365 * 24 * 60 * 60 * 1000);

    // saveCookieChoice: пишет выбор и сообщает о нём событием
    const store = {};
    const events = [];
    globalThis.window = {
        localStorage: { getItem: (k) => store[k] ?? null, setItem: (k, v) => { store[k] = v; } },
        dispatchEvent: (e) => events.push(e),
    };
    globalThis.CustomEvent ??= class extends Event { constructor(t, o) { super(t); this.detail = o?.detail; } };
    const saved = c.saveCookieChoice(false);
    assert.equal(saved.analytics, false);
    assert.equal(c.readCookieChoice()?.analytics, false);
    assert.equal(c.hasCookieConsent(), true);
    assert.equal(c.hasAnalyticsConsent(), false);
    assert.equal(events[0].type, c.COOKIE_CONSENT_EVENT);
    c.saveCookieChoice(true);
    assert.equal(c.hasAnalyticsConsent(), true);
    delete globalThis.window;
});

await check('cookie-баннер: «Настроить», «Отклонить», «Принять»; аналитика по умолчанию выключена; ссылка на политику', () => {
    for (const s of ['Настроить', 'Отклонить', 'Принять', 'Необходимые', 'Аналитика', 'Сохранить', 'Политика использования файлов cookie']) {
        assert.ok(banner.includes(s), `нет «${s}»`);
    }
    has(banner, /const \[analytics, setAnalytics\] = useState\(false\);/);
    has(banner, /onClick=\{\(\) => choose\(false\)\}/);
    has(banner, /onClick=\{\(\) => choose\(true\)\}/);
    has(banner, /href=\{LEGAL_LINKS\.cookies\}/);
    has(banner, /window\.addEventListener\(COOKIE_SETTINGS_OPEN_EVENT, reopen\)/);
    assert.ok(!/Продолжая пользоваться/.test(banner));
});

await check('Метрика — только после согласия на аналитику; подвал: «Настройки cookie», без заглушки реестра', () => {
    has(app, /\{analyticsAllowed && \(\s*<Script\s+id="yandex-metrika"/);
    assert.ok(!/mc\.yandex\.ru\/watch/.test(app));
    has(footer, /onClick=\{openCookieSettings\}/);
    has(footer, />\s*Настройки cookie\s*</);
    has(footer, /не является публичной офертой,\s*кроме документов в разделе <Link href="\/legal">«Правовая информация»<\/Link>/);
    assert.ok(!/\[РТА/.test(footer));
});

// Собрано из частей, чтобы сам скрипт не содержал запрещённых слов целиком.
const FORBIDDEN = [new RegExp('ПД' + 'н'), new RegExp(['Арлеки' + 'нотур', 'АРЛЕКИ' + 'НОТУР', 'Arle' + 'kino'].join('|'), 'i'), /Скоро/];
await check('нет сокращения вместо «персональных данных», стороннего юрлица и «Скоро»', () => {
    const hits = [];
    const files = {
        ui, callback, signup, signin, yandex, card, booking, partners, banner, footer,
        links: read('src/config/legalLinks.ts'), cookie: read('src/utils/cookieConsent.ts'),
    };
    for (const [name, text] of Object.entries(files)) {
        text.split('\n').forEach((line, i) => {
            if (FORBIDDEN.some((re) => re.test(line))) hits.push(`${name}:${i + 1}`);
        });
    }
    assert.deepEqual(hits, []);
});

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed ? 1 : 0);
