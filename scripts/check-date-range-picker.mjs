// Календарь «Даты и ночи»: ночи пересчитываются сразу после выбора возврата, в месяце нет дней
// соседнего месяца, период — сплошная полоса, возврат не дальше 30 ночей, прошедшие даты недоступны.
// Запуск: node scripts/check-date-range-picker.mjs
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (rel) => fs.readFileSync(path.join(root, rel), 'utf8');
const noComments = (s) => s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');

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

const cal = noComments(read('src/components/UI/calendar/index.tsx'));
const calCss = noComments(read('src/components/UI/calendar/calendar.module.css'));
const date = noComments(read('src/components/search/date.tsx'));
const nights = noComments(read('src/components/search/nights.tsx'));
const searchCss = noComments(read('src/components/search/search.module.css'));
const form = read('src/components/search/searchForm.tsx');
const hotelSection = read('src/components/hotelDetails/hotelSearchSection/index.tsx');

// Тело CSS-правила по точному селектору (вне @media).
function rule(css, selector) {
  const top = css.replace(/@media[^{]*\{(?:[^{}]*\{[^{}]*\})*[^{}]*\}/g, '');
  const esc = selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const m = top.match(new RegExp(`(?:^|\\})\\s*${esc}\\s*\\{([^}]*)\\}`));
  return m ? m[1] : null;
}

console.log('Календарь «Даты и ночи»');

check('ночи: сразу после выбора возврата уходит sync_nights_from_dates = возврат − вылет', () => {
  const fn = date.slice(date.indexOf('const syncRangeToParent'), date.indexOf('const handleSelectDate'));
  assert.match(fn, /'date_range'/);
  assert.match(fn, /differenceInCalendarDays\(normalizedEnd, normalizedStart\)/);
  assert.match(fn, /handleChange\(String\(nights\), 'sync_nights_from_dates'\)/);
  assert.ok(fn.indexOf("'date_range'") < fn.indexOf("'sync_nights_from_dates'"), 'сначала даты, потом ночи');
});

check('оба получателя обрабатывают sync_nights_from_dates (форма поиска и поиск на странице отеля)', () => {
  assert.match(form, /'sync_nights_from_dates'\)\s*\{[\s\S]{0,200}nights: String\(n\)/);
  assert.match(hotelSection, /key === 'sync_nights_from_dates'[\s\S]{0,300}nights: n,/);
});

check('возврат не раньше вылета и не дальше 30 ночей; прошедшие даты недоступны', () => {
  assert.match(date, /export const MAX_RANGE_NIGHTS = 30;/);
  assert.match(nights, /const MAX = 30;/, 'тот же предел, что у поля ночей');
  assert.match(date, /maxSelectableDate=\{maxReturnDate\}/);
  assert.match(date, /addDays\(startOfDay\(selectedDate\), MAX_RANGE_NIGHTS\)/);
  assert.match(date, /if \(day <= start\) \{[\s\S]{0,120}setSelectedDate\(day\)/, 'день до вылета — новый вылет');
  assert.match(date, /allowPastDates=\{false\}/);
  assert.match(cal, /isAfter\(day, maxSelectableDay\)/);
});

check('месяц: дни соседнего месяца не рисуются (пустая клетка)', () => {
  assert.match(cal, /if \(!props\.isCurrentMonth\) \{[\s\S]{0,200}styles\.cellEmpty[\s\S]{0,120}continue;/);
  const empty = rule(calCss, '.cellEmpty');
  assert.ok(empty && /visibility:\s*hidden/.test(empty));
});

check('период: полоса от середины вылета до середины возврата, скругление на краях недели', () => {
  assert.match(calCss, /\.cellInRange::before,\s*\.cellRangeStart::before,\s*\.cellRangeEnd::before\s*\{[^}]*content:\s*"";/);
  assert.match(rule(calCss, '.cellRangeStart::before') || '', /left:\s*50%/);
  assert.match(rule(calCss, '.cellRangeEnd::before') || '', /right:\s*50%/);
  assert.match(rule(calCss, '.cellInRange.cellRowStart::before') || '', /border-top-left-radius/);
  assert.match(rule(calCss, '.cellInRange.cellRowEnd::before') || '', /border-top-right-radius/);
  assert.match(cal, /styles\.cellRowStart/);
  assert.match(cal, /styles\.cellRowEnd/);
  const week = rule(calCss, '.weekRow');
  assert.match(week || '', /grid-template-columns:\s*repeat\(7,/, 'дни без промежутков — лента сплошная');
  assert.ok(!/var\(--bgSecondary\)/.test(rule(calCss, '.cellInRange') || ''), 'старая серая заливка убрана');
});

check('предпросмотр возврата при наведении и живое число ночей; блок ночей не прыгает', () => {
  assert.match(cal, /onPreviewDateChange/);
  assert.match(cal, /styles\.cellPreview/);
  assert.match(date, /onPreviewDateChange=\{setPreviewEndDate\}/);
  assert.match(date, /visibility: 'hidden'/);
  assert.match(date, /formatNightsCount\(shownNights\)/);
});

check('над календарём «Вылет» и «Возврат», активное — то, что выбирается', () => {
  assert.match(date, /styles\.dateRangeChipActive/);
  assert.match(date, /'Возврат — выберите'/);
  assert.ok(rule(searchCss, '.dateRangeChipActive'), 'стиль активного поля');
  assert.ok(!/Вылет: \{startLabel\} · Возврат/.test(date), 'старой строки-сводки нет');
});

check('ночи пишутся с правильным окончанием', () => {
  assert.match(nights, /formatNightsCount\(values\[0\]\)/);
  assert.ok(!/\{values\[0\]\} ночей/.test(nights));
});

check('телефон: календарь — нижняя шторка с прокруткой, без сдвига margin-top', () => {
  const css = read('src/components/search/search.module.css');
  const m = css.match(/@media \(max-width: 1024px\)[\s\S]*?\.dateModal \{([^}]*)\}/);
  assert.ok(m, 'правило .dateModal в @media 1024');
  assert.match(m[1], /bottom:\s*0/);
  assert.match(m[1], /overflow-y:\s*auto/);
  assert.match(m[1], /max-height:\s*92dvh/);
  assert.ok(!/-536px/.test(css));
});

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed ? 1 : 0);
