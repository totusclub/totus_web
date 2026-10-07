// /tickets: лёгкий ответ API (view=list), отмена устаревших запросов и пауза при переключении фильтров.
// Запуск: node scripts/check-flights-request.mjs (без npm install).
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

const api = code(read('src/api/levelTravelApi.tsx'));
const page = code(read('src/pages/tickets/index.tsx'));

console.log('Билеты: запрос перелётов');

check('Packagesflights: view и signal необязательны; без них — прежний запрос (бронирование, оформление)', () => {
  assert.match(api, /options\?: \{ view\?: 'list'; signal\?: AbortSignal \}/);
  assert.match(api, /\.\.\.\(options\?\.view \? \{ params: \{ view: options\.view \} \} : \{\}\)/);
  assert.match(api, /\.\.\.\(options\?\.signal \? \{ signal: options\.signal \} : \{\}\)/);
  assert.match(api, /const body = sanitizePackageFlightsParams\(/, 'тело запроса прежнее — view только в query');
});

check('страница билетов: лёгкий ответ и отмена предыдущего запроса', () => {
  assert.match(page, /Packagesflights\(paramsFlight, \{ view: 'list', signal: controller\.signal \}\)/);
  assert.match(page, /abortRef\.current\?\.abort\(\);\s*const controller = new AbortController\(\);/);
});

check('устаревший ответ не перетирает новый список и не показывает ошибку', () => {
  assert.match(page, /const seq = \+\+requestSeqRef\.current;/);
  assert.match(page, /if \(!isCurrent\(\)\) return f;\s*setAllFlights\(f\.flights \|\| \[\]\);/);
  assert.match(page, /if \(!isCurrent\(\) \|\| isAbortError\(err\)\) return undefined;/);
  assert.match(page, /if \(isCurrent\(\)\) setLoading\(false\);/);
});

check('фильтры: пауза 400 мс — серия кликов даёт один запрос с последним набором', () => {
  assert.match(page, /const FLIGHTS_FILTERS_DEBOUNCE_MS = 400;/);
  assert.match(page, /if \(filtersTimerRef\.current\) clearTimeout\(filtersTimerRef\.current\);\s*filtersTimerRef\.current = setTimeout\(\(\) => \{/);
  assert.match(page, /\}, FLIGHTS_FILTERS_DEBOUNCE_MS\);/);
});

check('бизнес-логика прежняя: повтор после actualize, тексты ошибок, состав фильтров', () => {
  assert.match(page, /if \(allowRetry && isPackageGoneError\(err\)\)/);
  assert.match(page, /\{ allowRetry: false \}/);
  assert.match(page, /'Не удалось загрузить варианты перелёта\. Попробуйте выбрать тур заново\.'/);
  assert.match(page, /\.\.\.pickActiveFlightFilters\(data\),\s*package_id: packageId,/);
});

check('уход со страницы: таймер и запрос отменяются', () => {
  assert.match(page, /useEffect\(\(\) => \(\) => \{\s*if \(filtersTimerRef\.current\) clearTimeout\(filtersTimerRef\.current\);\s*abortRef\.current\?\.abort\(\);\s*\}, \[\]\);/);
});

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed ? 1 : 0);
