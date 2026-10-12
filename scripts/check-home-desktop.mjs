// Главная на компьютере (шире 1024 px) — вариант B «Строгий», выбран владельцем 12.10.2026
// (артефакт «Главная на компьютере», claude/HOME_DESKTOP_RU.md): скругление 12, шаг секций 56,
// заголовки 28/36, фото 16:10 и 3:2, белый текст на оранжевом и на фото, видимые рамки в тёмной теме,
// форма поиска в колонке страницы. Телефон и планшет (до 1024 px) не меняются.
// Запуск: node scripts/check-home-desktop.mjs (без npm install).
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

/** Содержимое всех блоков @media (...) — по балансу скобок. */
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
const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const rule = (src, sel) => (src.match(new RegExp(`(?:^|[\\n}])\\s*${esc(sel)}\\s*\\{([^}]*)\\}`)) || [])[1] || '';

const home = noComments(read('src/components/home/home.module.css'));
const box = noComments(read('src/components/hotelBox/hotelBox.module.css'));
const search = noComments(read('src/components/search/search.module.css'));
const D = '(min-width: 1025px)';
const homeD = media(home, D);
const boxD = media(box, D);
const searchD = media(search, D);

console.log('Главная на компьютере: вариант B');

check('изменения только шире 1024 px: блоки для телефона остались как были', () => {
  assert.ok(homeD && boxD && searchD, 'есть блоки @media (min-width: 1025px)');
  const mob = media(home, '(max-width: 1024px)');
  assert.match(rule(mob, '.hotProductTitle'), /margin: 0 16px 12px;/);
  assert.match(rule(mob, '.recomendDeslistItem'), /height: 200px;[\s\S]*border-radius: 8px;/);
  assert.match(rule(media(box, '(max-width: 1024px)'), '.hotelBoxCardImage'), /height: 200px;\s*border-radius: 8px;/);
});

check('скругление 12 (блок звонка 16): баннеры, фото, направления, партнёры, вопросы FAQ', () => {
  assert.match(rule(homeD, '.bannerItem'), /border-radius: 12px;/);
  assert.match(rule(boxD, '.hotelBoxCardImage'), /border-radius: 12px;/);
  assert.match(rule(homeD, '.recomendDeslistItem'), /border-radius: 12px;/);
  assert.match(rule(homeD, '.recomendDeslistItemInfo'), /border-bottom-left-radius: 12px;\s*border-bottom-right-radius: 12px;/);
  assert.match(rule(homeD, '.partnerItem'), /padding: 16px;\s*border-radius: 12px;/);
  assert.match(rule(homeD, '.callRequest'), /border-radius: 16px;/);
  assert.match(rule(homeD, '.faqCal > div'), /border-radius: 12px;\s*overflow: hidden;/);
});

check('шаг секций 56, заголовки 28/36 и 16 до карточек, промежутки 16 (партнёры 12)', () => {
  assert.match(rule(homeD, '.banners'), /gap: 16px;\s*margin-top: 40px;\s*margin-bottom: 56px;/);
  assert.match(rule(homeD, '.popularDestinationsWrapper'), /padding-top: 56px;\s*padding-bottom: 56px;/);
  assert.match(rule(homeD, '.callRequest'), /margin-top: 56px;\s*margin-bottom: 56px;/);
  assert.match(rule(homeD, '.faqContainer'), /padding-top: 56px;\s*padding-bottom: 56px;/);
  for (const sel of ['.hotProductTitle', '.faqContainer > p']) assert.match(rule(homeD, sel), /font-size: 28px;\s*line-height: 36px;/, sel);
  assert.match(rule(homeD, '.hotProductTitle'), /margin-top: 0;\s*margin-bottom: 16px;/);
  assert.match(rule(homeD, '.recomendDeslist'), /gap: 16px;/);
  assert.match(rule(homeD, '.partnerList'), /gap: 12px;\s*margin-bottom: 0;/);
  assert.match(rule(homeD, '.faqRow'), /margin-top: 24px;\s*gap: 16px;/);
});

check('картинки прямоугольные: горящие туры 16:10 от верха кадра, направления 3 колонки 3:2', () => {
  const img = rule(boxD, '.hotelBoxCardImage');
  assert.match(img, /height: auto;\s*aspect-ratio: 16 \/ 10;/);
  assert.match(img, /background-position: center top;/);
  const d = rule(homeD, '.recomendDeslistItem');
  assert.match(d, /flex: 0 0 calc\(\(100% - 32px\) \/ 3\);\s*min-width: 0;\s*height: auto;\s*aspect-ratio: 3 \/ 2;/);
  assert.match(rule(homeD, '.recomendDeslistItemInfo'), /height: 60%;\s*background: linear-gradient\(180deg, rgba\(0, 0, 0, 0\) 0%, rgba\(0, 0, 0, 0\.6\) 100%\);/);
});

check('тёмная тема: на оранжевом и на фото текст белый, поле номера светлое, рамки #2c2c2c', () => {
  assert.match(homeD, /\.formRequestCallHead > p,\s*\.formRequestCallBtnDisable > p \{\s*color: #ffffff;\s*\}/);
  assert.match(rule(homeD, '.formRequestCallInput input'), /background: #ffffff;\s*color: #141414;\s*border-color: transparent;/);
  assert.match(rule(homeD, '.recomendDeslistItemInfoText'), /color: #ffffff;/);
  assert.match(rule(boxD, '.hotelBoxCardStatus>p'), /color: #ffffff;/);
  assert.match(homeD, /:global\(\[data-theme="dark"\]\) \.recomendDeslistItem,\s*:global\(\[data-theme="dark"\]\) \.partnerItem \{\s*border-color: #2c2c2c;\s*\}/);
});

check('hero: форма в колонке страницы, скругления 16/14/10, подсказки вкладок — только в hero главной', () => {
  assert.match(rule(searchD, '.search'), /padding-left: 0;\s*padding-right: 0;\s*align-items: stretch;/);
  assert.match(rule(searchD, '.search .searchContent'), /width: 100%;\s*max-width: 1280px;\s*margin-left: auto;\s*margin-right: auto;/);
  assert.match(rule(searchD, '.search .searchForm'), /border-radius: 16px;/);
  assert.match(rule(searchD, '.search .searchTypeTabs'), /border-radius: 14px;/);
  assert.match(searchD, /\.search \.searchTypeTabIndicator,\s*\.search \.searchTypeTab \{\s*border-radius: 10px;\s*\}/);
  assert.match(rule(searchD, '.search .searchTypeTabHint'), /color: rgba\(255, 255, 255, 0\.72\);/);
  assert.match(searchD, /:global\(\[data-theme="light"\]\) \.search \.searchTypeTabActive \.searchTypeTabHint \{\s*color: var\(--textTertiary\);\s*\}/);
  // все правила hero — внутри .search (корень hero главной), форма в шапке других страниц не меняется
  const sels = searchD.replace(/\{[^}]*\}/g, '\n').split('\n').map((s) => s.trim()).filter(Boolean);
  for (const s of sels) assert.ok(/(^|\s|,)\.search(\s|$|,)/.test(s) || s === '.search', `вне hero: ${s}`);
});

check('без !important и без шрифтов в новых блоках', () => {
  for (const b of [homeD, boxD, searchD]) {
    assert.ok(!/!important/.test(b));
    assert.ok(!/font-family/.test(b));
  }
});

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed ? 1 : 0);
