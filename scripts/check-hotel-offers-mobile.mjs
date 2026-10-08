// Страница отеля: предложения номера на телефоне (макет «до / после» утверждён владельцем 08.10.2026).
// Статическая проверка исходников. Запуск: node scripts/check-hotel-offers-mobile.mjs
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (rel) => fs.readFileSync(path.join(root, rel), 'utf8');
const code = (s) => s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:])\/\/.*$/gm, '$1');

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

const list = code(read('src/components/hotelDetails/hotelDetailsRooms/priceList.tsx'));
const css = read('src/components/hotelDetails/hotelDetails.module.css');
const mobile = (() => {
  const i = css.lastIndexOf('@media (max-width: 768px)');
  assert.ok(i >= 0, 'нет блока @media (max-width: 768px)');
  return code(css.slice(i));
})();
const rule = (src, selector) => {
  const esc = selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const m = src.match(new RegExp(`(^|\\n)\\s*${esc} \\{([^}]*)\\}`));
  assert.ok(m, `нет правила ${selector}`);
  return m[2];
};

console.log('Страница отеля: предложения номера на телефоне');

check('подпись: «7 ночей · с 15.10» — склонение ночей, строчная «с»', () => {
  assert.match(list, /import \{ formatNightsCount \} from '@\/utils\/formatRussianPlural';/);
  assert.match(list, /return day && month \? `с \$\{day\}\.\$\{month\}` : '';/);
  assert.match(list, /\[formatNightsCount\(room\?\.nights_count\), formatDate\(room\?\.start_date\)\]\.filter\(Boolean\)\.join\(' · '\)/);
  assert.match(list, /<span>\{formatWhen\(room\)\}<\/span>/);
  assert.ok(!/ночей  \{formatDate/.test(list), 'старая подпись убрана');
  assert.ok(!/`С \$\{day\}/.test(list), 'без заглавной «С»');
});

check('основная кнопка — у самого дешёвого из видимых предложений, у остальных — класс Secondary', () => {
  assert.match(list, /const visibleOffers = offerGroups\.flatMap\(\(group\) => \(showAll \? group\.offers : group\.offers\.slice\(0, 1\)\)\);/);
  assert.match(list, /if \(primaryPrice == null \|\| price < primaryPrice\)/);
  assert.match(list, /const isPrimary = room\?\.id === primaryOfferId;/);
  assert.match(list, /className=\{`\$\{styles\.HotelDetailsPriceListItem\}\$\{isPrimary \? '' : ` \$\{styles\.HotelDetailsPriceListItemSecondary\}`\}`\}/);
});

check('логика не тронута: бронирование выбранной строки, «Лучшая цена», «Показать ещё»', () => {
  assert.match(list, /onClick=\{\(\)=>handleBook\(room\.id\)\}/);
  assert.match(list, /createPackage\(\{ request_id: requestId as never, tour_id: id as never \}\)/);
  assert.match(list, /const hasBestPrice = bestPriceOfferId != null && room\?\.id === bestPriceOfferId;/);
  assert.match(list, /const visibleCount = showAll \? totalCount : offerGroups\.length;/);
});

check('до 768 px: сетка «описание | цена», кнопка на всю ширину 44 px', () => {
  const item = rule(mobile, '.HotelDetailsPriceListItem');
  assert.match(item, /display: grid;/);
  assert.match(item, /grid-template-columns: minmax\(0, 1fr\) auto;/);
  assert.match(item, /padding: 14px;/);
  assert.match(rule(mobile, '.HotelDetailsPriceListPriceBlock'), /align-items: flex-end;\s*text-align: right;/);
  assert.match(rule(mobile, '.HotelDetailsPriceListPriceValue'), /font-size: 18px;[\s\S]*white-space: nowrap;/);
  const btn = rule(mobile, '.HotelDetailsPriceListItem .mobButton');
  assert.match(btn, /grid-column: 1 \/ -1;/);
  assert.match(btn, /padding-top: 0;\s*padding-bottom: 0;/);
  assert.match(rule(mobile, '.HotelDetailsPriceListItem .mobButton > div'), /width: 100% !important;\s*height: 44px !important;/);
  assert.ok(!/\.HotelDetailsPriceListItem \{\s*flex-direction: column;/.test(mobile), 'старая раскладка столбиком убрана');
});

check('до 768 px: второстепенные предложения — кнопка-контур с читаемым текстом', () => {
  assert.match(mobile, /\.HotelDetailsPriceListItemSecondary \.mobButton > div,\s*\.HotelDetailsPriceListItemSecondary \.mobButton > div:hover \{\s*background-color: transparent;\s*box-shadow: inset 0 0 0 1\.5px var\(--core_Orange\);/);
  assert.match(mobile, /\.HotelDetailsPriceListItemSecondary \.mobButton > div span \{\s*color: var\(--primary_orange\);/);
  // класс существует только в мобильном блоке — на desktop кнопки не меняются
  const desktop = code(css.slice(0, css.indexOf('@media (max-width: 1024px)')));
  assert.ok(!/HotelDetailsPriceListItemSecondary/.test(desktop));
});

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed ? 1 : 0);
