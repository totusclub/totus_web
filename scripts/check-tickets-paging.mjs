// /tickets: перелёты к туру показываются частями (по 20), остальные — при прокрутке / «Показать ещё».
// Запуск: node scripts/check-tickets-paging.mjs (без npm install).
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

const list = code(read('src/components/searchPage/searchResult/searchTicketList.tsx'));
const item = code(read('src/components/ticketItem/index.tsx'));

console.log('Билеты: показ частями');

check('рендерится только видимая часть (по 20), ключ — flight_pair_id', () => {
  assert.match(list, /export const TICKETS_PAGE_SIZE = 20;/);
  assert.match(list, /flights\.slice\(0, shownCount\)\.map\(\(item, index\) => \(\s*<TicketItem key=\{flightKey\(item, index\)\}/);
  assert.match(list, /item\?\.flight_pair_id \?\? `flight-\$\{index\}`/);
  assert.ok(!/flights\.map\(/.test(list), 'полный список не рисуется');
});

check('SelectedTour (цена «от») получает полный список; «зелёный» — первый рейс, как раньше', () => {
  assert.match(list, /<SelectedTour packages=\{packages\} flights=\{flights\} \/>/);
  assert.match(list, /green=\{index === 0\}/);
});

check('догрузка: IntersectionObserver у конца списка + кнопка «Показать ещё»; новый список — с начала', () => {
  assert.match(list, /new window\.IntersectionObserver\(/);
  assert.match(list, /if \(entries\[0\]\?\.isIntersecting\) showMore\(\);/);
  assert.match(list, /rootMargin: '300px 0px'/);
  assert.match(list, /<Button title=\{'Показать ещё'\} onClick=\{showMore\} \/>/);
  assert.match(list, /<div ref=\{sentinelRef\} className=\{styles\.loadMoreSentinel\} aria-hidden \/>/);
  assert.match(list, /useEffect\(\(\) => \{\s*setVisibleCount\(TICKETS_PAGE_SIZE\);\s*\}, \[flights\]\);/);
  assert.match(list, /Math\.min\(count \+ TICKETS_PAGE_SIZE, flightsCount\)/);
});

check('счётчик: «Показано X из N», когда показана часть; иначе «Найдено N»', () => {
  assert.match(list, /`Показано \$\{shownCount\} из \$\{flightsCount\} /);
  assert.match(list, /`Найдено \$\{flightsCount\} /);
});

check('карточка: окно деталей — только при открытии; логотипы авиакомпаний лениво', () => {
  assert.match(item, /\{open && <TicketModal open=\{open\} setOpen=\{setOpen\} item=\{item\} \/>\}/);
  assert.equal((item.match(/alt=\{item\?\.(to|back)\?\.airline\?\.name\} loading="lazy" decoding="async"/g) || []).length, 2);
  assert.match(item, /import AuthModal from "@\/components\/auth\/LazyAuthModal";/);
});

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed ? 1 : 0);
