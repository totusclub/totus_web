// Главная на телефоне и планшете (до 1024 px) — макет «Главная на телефоне», утверждён 09.10.2026:
// единые поля и шаг секций, фото как в результатах поиска, тёмная тема, нижнее меню с иконками приложения.
// Карусели — scripts/check-mobile-sliders.mjs. Компьютер (> 1024 px) не меняется.
// Запуск: node scripts/check-home-mobile.mjs (без npm install).
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (rel) => fs.readFileSync(path.join(root, rel), 'utf8');
const noComments = (s) => s.replace(/\/\*[\s\S]*?\*\//g, '');

let passed = 0;
let failed = 0;
function check(name, fn) {
  try {
    fn();
    passed++;
    console.log(`  ok   ${name}`);
  } catch (e) {
    failed++;
    console.log(`  FAIL ${name}\n       ${e && e.message ? e.message : e}`);
  }
}

/** Все блоки @media (...) подряд — по балансу скобок. */
function media(src, query) {
  let out = '';
  let i = 0;
  while ((i = src.indexOf(`@media ${query}`, i)) >= 0) {
    let depth = 0;
    for (let j = src.indexOf('{', i); j < src.length; j++) {
      if (src[j] === '{') depth++;
      else if (src[j] === '}' && --depth === 0) { out += src.slice(src.indexOf('{', i) + 1, j); i = j; break; }
    }
  }
  return out;
}
const rule = (src, sel) => (src.match(new RegExp(`(?:^|[\\n}])\\s*${sel.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*\\{([^}]*)\\}`)) || [])[1] || '';

const home = noComments(read('src/components/home/home.module.css'));
const homeM = media(home, '(max-width: 1024px)');
const box = noComments(read('src/components/hotelBox/hotelBox.module.css'));
const boxM = media(box, '(max-width: 1024px)');
const search = noComments(read('src/components/hotelCard/hotelCard.module.css'));
const searchTitleCss = noComments(read('src/components/search/search.module.css'));
const globals = noComments(read('src/styles/globals.css'));
const barCss = noComments(read('src/components/mobileBottomBar/mobileBottomBar.module.css'));
const barM = media(barCss, '(max-width: 1024px)');
const bar = read('src/components/mobileBottomBar/index.tsx');

console.log('Главная на телефоне');

check('поля 16px и шаг секций: после поиска 24px, дальше 32px; заголовок секции 20/24, до карточек 12px', () => {
  assert.match(rule(homeM, '.contentFullHide'), /padding-top: 24px;/);
  assert.match(rule(homeM, '.popularDestinationsWrapper'), /padding: 32px 0 0;/);
  assert.match(rule(homeM, '.partnerListMob'), /margin-top: 24px;/);
  assert.match(rule(homeM, '.callRequest'), /margin-top: 32px;/);
  assert.match(rule(homeM, '.faqBg'), /margin-top: 32px;/);
  assert.match(rule(homeM, '.faqContainer'), /padding-top: 24px;\s*padding-bottom: 32px;/);
  const t = rule(homeM, '.hotProductTitle');
  assert.match(t, /font-size: 20px;/);
  assert.match(t, /line-height: 24px;/);
  assert.match(t, /margin: 0 16px 12px;/);
  assert.match(t, /padding-right: 0;/);
});

check('фото отелей и направлений — как в результатах поиска (200px, скругление 8px)', () => {
  assert.match(search, /\.hotelCardImage \{\s*width: 100%;\s*height: 200px;/, 'эталон в поиске не изменился');
  const img = rule(boxM, '.hotelBoxCardImage');
  assert.match(img, /height: 200px;/);
  assert.match(img, /border-radius: 8px;/);
  const dest = rule(homeM, '.recomendDeslistItem');
  assert.match(dest, /height: 200px;/);
  assert.match(dest, /border-radius: 8px;/);
  assert.match(dest, /margin: 0;/);
});

check('лишних отступов у карточек нет (прежние :nth-child(1) срабатывали на каждой карточке)', () => {
  assert.ok(!/\.hotelBoxCard:nth-child/.test(box));
  assert.ok(!/\.partnerItem:nth-child/.test(home));
  assert.ok(!/padding-right: 16px;/.test(box));
});

check('блок «Оставьте номер»: высота по содержимому, поля 24/16px', () => {
  const c = rule(homeM, '.callRequest');
  assert.match(c, /height: auto;/);
  assert.match(c, /border-radius: 24px;/);
  assert.match(rule(homeM, '.callRequestInfo'), /position: relative;\s*height: auto;\s*padding: 24px 16px;/);
  assert.match(rule(homeM, '.callRequestLeyer'), /position: absolute;\s*top: 0;\s*left: 50%;[^}]*height: 100%;[^}]*aspect-ratio: 1282 \/ 400;\s*transform: translateX\(-50%\);/);
});

check('тёмная тема: текст на фото и оранжевом — белый; серый текст светлее (#999)', () => {
  assert.match(rule(homeM, '.formRequestCallHead > p'), /color: #ffffff;/);
  assert.match(rule(homeM, '.formRequestCallBtnDisable > p'), /color: #ffffff;/);
  assert.match(rule(homeM, '.recomendDeslistItemInfoText'), /color: #ffffff;/);
  assert.match(rule(boxM, '.hotelBoxCardStatus>p'), /color: #ffffff;/);
  assert.match(media(searchTitleCss, '(max-width: 1024px)'), /\.searchTitle \{[^}]*color: #ffffff;/);
  assert.match(media(globals, '(max-width: 1024px)'), /\[data-theme="dark"\] \{\s*--textTertiary: #999999;\s*\}/);
  assert.match(globals, /\[data-theme="dark"\] \{[^}]*--textTertiary: #7a7a7a;/, 'на компьютере прежний цвет');
});

check('нижнее меню: иконки набора Totus (поиск, заказы, аккаунт) с подписями; высота 60px', () => {
  for (const [name, icon] of [['SearchTabIcon', 'iconTabSearch'], ['OrdersTabIcon', 'iconTabOrders'], ['AccountTabIcon', 'iconTabAccount']])
    assert.match(bar, new RegExp(`const ${name} = \\(\\) => <TotusIcon icon=\\{${icon}\\} size=\\{24\\} />;`));
  for (const label of ['Поиск', 'Заказы', 'Аккаунт']) assert.match(bar, new RegExp(`<span className=\\{styles\\.tabLabel\\}>${label}</span>`));
  assert.ok(!/import Icon from/.test(bar), 'значки сайта больше не нужны');
  assert.match(rule(barM, '.mobileTab'), /height: 60px;/);
});

check('нижнее меню: цвета как в приложении — активная оранжевая, неактивная цвет текста, в тёмной #b0b0b0', () => {
  assert.match(rule(barM, '.itemTabNav'), /color: var\(--textPrimary\);/);
  assert.match(barM, /:global\(\[data-theme="dark"\]\) \.itemTabNav\{\s*color: #b0b0b0;\s*\}/);
  assert.match(barM, /\.itemTabNav\.itemTabNavActive\{\s*color: var\(--core_Orange\);\s*\}/);
  assert.match(bar, /\['home', 'search', 'tickets', 'hotel-details'\]\.includes\(pageName\) \? styles\.itemTabNavActive/);
  assert.match(bar, /\['my-orders'\]\.includes\(pageName\) \? styles\.itemTabNavActive/);
  assert.match(bar, /\['profile', 'support-chat'\]\.includes\(pageName\) \? styles\.itemTabNavActive/);
});

check('нижнее меню: переходы и точка непрочитанных те же', () => {
  assert.match(bar, /onClick=\{\(\)=>handleHome\(\)\}/);
  assert.match(bar, /token\? router\.push\('\/profile\/my-orders'\):setAuthModalOpen\(true\)/);
  assert.match(bar, /token\? router\.push\('\/profile'\):setAuthModalOpen\(true\)/);
  assert.match(bar, /token && supportUnread > 0 \? <span className=\{styles\.tabBadge\}/);
});

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed ? 1 : 0);
