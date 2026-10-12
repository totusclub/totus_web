// Билеты на телефоне и планшете (до 1024 px) — вариант B «Билет», утверждён 12.10.2026
// (артефакт «Билеты на телефоне», claude/TICKETS_MOBILE_RU.md) + две ошибки данных карточки.
// Компьютер (> 1024 px) не меняется. Запуск: node scripts/check-tickets-mobile.mjs (без npm install).
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (rel) => fs.readFileSync(path.join(root, rel), 'utf8');
const noComments = (s) => s.replace(/\/\*[\s\S]*?\*\//g, '');
const code = (s) => noComments(s).replace(/(^|[^:])\/\/.*$/gm, '$1');

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

const item = code(read('src/components/ticketItem/index.tsx'));
const css = noComments(read('src/components/ticketItem/ticketItem.module.css'));
const M = media(css, '(max-width: 1024px)');
const list = code(read('src/components/searchPage/searchResult/searchTicketList.tsx'));
const listCss = noComments(read('src/components/searchPage/searchResult/ticketList.module.css'));
const LM = media(listCss, '(max-width: 1024px)');

console.log('Билеты на телефоне: вариант B «Билет»');

check('до 1024 px — своя карточка (.mob), прежняя (.ticketDesktop) скрыта; шире — наоборот', () => {
  assert.match(css, /\.mob \{\s*display: none;\s*\}\s*@media \(max-width: 1024px\)/);
  assert.match(rule(M, '.ticketDesktop'), /display: none;/);
  assert.match(rule(M, '.mob'), /display: flex;/);
  assert.match(item, /className=\{`\$\{green \? styles\.ticketItemWrapper : ''\} \$\{styles\.ticketDesktop\}`\}/);
  assert.match(item, /<div className=\{styles\.mob\}>/);
  // прежние правила компьютера не тронуты
  assert.match(rule(css, '.ticketItem'), /padding: 16px 16px 16px 1px;[\s\S]*border-radius: 24px;/);
  assert.match(rule(media(css, '(max-width: 768px)'), '.ticketItemPriceInfo'), /width: 100%;/);
});

check('карточка: скругление 20, рамка 1 px (#e6e6e6, в тёмной #2c2c2c), поля 16, сегменты через линию', () => {
  const m = rule(M, '.mob');
  assert.match(m, /--tkLine: #e6e6e6;/);
  assert.match(m, /border: 1px solid var\(--tkLine\);/);
  assert.match(m, /border-radius: 20px;/);
  assert.match(m, /overflow: hidden;/);
  assert.match(M, /:global\(\[data-theme="dark"\]\) \.mob \{\s*--tkLine: #2c2c2c;\s*\}/);
  assert.match(rule(M, '.mobBody'), /gap: 12px;\s*padding: 16px;/);
  assert.match(rule(M, '.mobSeg + .mobSeg'), /padding-top: 12px;\s*border-top: 1px solid var\(--tkLine\);/);
});

check('сегмент как в билете: время 20 px в одну строку, длительность и «Прямой / с пересадкой» между, аэропорты и города', () => {
  assert.match(rule(M, '.mobSegTimes'), /grid-template-columns: auto 1fr auto;/);
  assert.match(rule(M, '.mobSegTimes > b'), /font-size: 20px;[\s\S]*font-variant-numeric: tabular-nums;/);
  assert.match(item, /<b>\{formatRussianDateTime\(flight\?\.departure\)\}<\/b>/);
  assert.match(item, /<b>\{formatRussianDateTime\(flight\?\.arrival\)\}<\/b>/);
  assert.match(item, /<span>\{secondsToRussianTime\(flight\?\.time\)\}<\/span>/);
  assert.match(item, /\{transferLabel\(flight, true\)\}/);
  assert.match(item, /\[flight\?\.origin\?\.code, getPlaceName\(flight\?\.origin\)\]\.filter\(Boolean\)\.join\(' · '\)/);
  assert.match(item, /\{renderMobileSegment\(item\?\.to, 'Туда'\)\}\s*\{renderMobileSegment\(item\?\.back, 'Обратно'\)\}/);
});

check('«Самый выгодный рейс к туру» — полоса внутри карточки сверху, тёмный текст в обеих темах', () => {
  assert.match(item, /\{green && \(\s*<div className=\{styles\.mobBadge\}>/);
  const b = rule(M, '.mobBadge');
  assert.match(b, /background: var\(--secondary_green\);/);
  assert.match(b, /color: #0b3b2e;/);
});

check('низ — «корешок» на втором фоне под пунктиром: цена слева, «Выбрать» 44 px справа, «Детали перелёта» — кнопка 36 px', () => {
  assert.match(rule(M, '.mobStub'), /background: var\(--bgSecondary\);\s*border-top: 1px dashed var\(--tkLine\);/);
  assert.match(rule(M, '.mobFoot'), /justify-content: space-between;/);
  assert.match(item, /height="44px"\s*width="100%"\s*br=\{22\}/);
  assert.match(rule(M, '.mobChoose'), /width: 132px;/);
  assert.match(item, /<button type="button" onClick=\{\(\) => setOpen\(true\)\} className=\{styles\.mobDetails\}>/);
  assert.match(rule(M, '.mobDetails'), /height: 36px;/);
  assert.match(rule(M, '.mobTags > li'), /border-radius: 8px;/);
});

check('загрузка: заглушка той же формы (на компьютере — прежняя)', () => {
  assert.match(item, /const mobileSkeleton = \(\s*<div className=\{styles\.mob\} aria-hidden="true">/);
  assert.match(item, /<div className=\{`\$\{styles\.ticketItemWrapper\} \$\{styles\.ticketDesktop\}`\}>\s*\{skeletonContent\}/);
  assert.match(item, /\{mobileSkeleton\}/);
});

check('данные: «Багаж … обратно» — из обратного рейса; у пересадки — «С пересадкой», а не пустая строка', () => {
  assert.match(item, /\{item\?\.back\?\.luggage\?\.hold\?\.count > 0 && \(\s*<li>Багаж \{item\?\.back\?\.luggage\?\.hold\?\.weight\} кг обратно<\/li>/);
  assert.ok(!/item\?\.to\?\.luggage\?\.hold\?\.weight\} кг обратно/.test(item), 'вес «обратно» больше не берётся из «туда»');
  assert.match(item, /flight\?\.direct \? 'Прямой' : \(item\?\.direction \|\| \(lower \? 'с пересадкой' : 'С пересадкой'\)\)/);
  assert.equal((item.match(/<p>\{transferLabel\(item\?\.(to|back)\)\}<\/p>/g) || []).length, 2);
  assert.ok(!/: item\?\.direction\}/.test(item));
});

check('список: тур 16 px от шапки, счётчик строкой без плашки, между карточками 16 — только до 1024 px', () => {
  assert.match(list, /import tl from '\.\/ticketList\.module\.css';/);
  assert.match(list, /<div className=\{tl\.tour\}>\s*<SelectedTour packages=\{packages\} flights=\{flights\} \/>\s*<\/div>/);
  assert.match(list, /className=\{`\$\{styles\.resultListSelectedFilter\} \$\{tl\.countRow\}`\}/);
  assert.match(list, /className=\{`\$\{styles\.resultListItems\} \$\{tl\.items\}`\}/);
  assert.match(rule(LM, '.tour.tour > *'), /margin-top: 16px;/);
  assert.match(rule(LM, '.countRow.countRow'), /background: none;/);
  assert.match(rule(LM, '.countRow.countRow p'), /text-align: left;/);
  assert.match(rule(LM, '.items.items'), /gap: 16px;/);
  assert.equal(listCss.replace(/@media \(max-width: 1024px\) \{[\s\S]*\}\s*$/, '').trim(), '', 'всё — внутри @media (max-width: 1024px)');
});

check('без ₽ в разметке (цены — formatMoneyRub), без !important', () => {
  assert.ok(!/₽/.test(item));
  assert.ok(!/!important/.test(M + LM));
});

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed ? 1 : 0);
