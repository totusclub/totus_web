// Тур без перелёта: «Продолжить без перелёта», когда Level.Travel отвечает «No flights available for this package».
// Запуск: node scripts/check-no-flight-booking.mjs (без npm install).
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

const offer = code(read('src/utils/bookingOffer.ts'));
const status = code(read('src/components/bookingPage/bookingStatus.tsx'));
const card = code(read('src/components/bookingPage/orderCard.tsx'));
const booking = code(read('src/components/bookingPage/index.tsx'));
const tickets = code(read('src/pages/tickets/index.tsx'));

/** Достаёт функцию из TS-исходника и убирает аннотации типов, чтобы выполнить её в node. */
function loadFn(src, name, globals = {}) {
  const start = src.indexOf(`export function ${name}(`);
  assert.ok(start >= 0, `нет функции ${name}`);
  let depth = 0;
  let end = src.indexOf('{', start);
  for (let i = end; i < src.length; i++) {
    if (src[i] === '{') depth++;
    if (src[i] === '}') { depth--; if (depth === 0) { end = i + 1; break; } }
  }
  const js = src
    .slice(start, end)
    .replace(/^export /, '')
    .replace(/\)\s*:\s*[^{]+\{/, ') {')
    .replace(/(\w+)\??: (any|unknown|string|boolean|Record<string, unknown> \| null \| undefined)/g, '$1');
  const keys = Object.keys(globals);
  return new Function(...keys, `${js}; return ${name};`)(...keys.map((k) => globals[k]));
}

console.log('Тур без перелёта');

// Ответ actualize для тура 410145997 (29.10.2026), сокращён.
const noFlights = {
  success: false, rotten: false, exclude_operator: false,
  package: { id: 410145997, available: true, manual: true, price: 10, search_type: 'package' },
  exception: 'No flights available for this package',
};

check('isNoFlightsPayload: «нет перелётов» — да; протухший, снятый, успешный, другая ошибка — нет', () => {
  const fn = loadFn(offer, 'isNoFlightsPayload');
  assert.equal(fn(noFlights), true);
  assert.equal(fn({ ...noFlights, rotten: true }), false);
  assert.equal(fn({ ...noFlights, package: { ...noFlights.package, available: false } }), false);
  assert.equal(fn({ ...noFlights, success: true }), false);
  assert.equal(fn({ ...noFlights, exception: 'Tour not found' }), false);
  assert.equal(fn({ success: false, exception: 'No flights available' }), false, 'без package — нет');
  assert.equal(fn(null), false);
});

check('ссылка и признак режима: /booking?package=ID&no_flight=1', () => {
  assert.match(offer, /export const NO_FLIGHT_QUERY_KEY = 'no_flight';/);
  const href = loadFn(offer, 'getNoFlightBookingHref', { NO_FLIGHT_QUERY_KEY: 'no_flight' });
  assert.equal(href(410145997), '/booking?package=410145997&no_flight=1');
  assert.equal(href('abc'), null);
  const isMode = loadFn(offer, 'isNoFlightQuery', { NO_FLIGHT_QUERY_KEY: 'no_flight' });
  assert.equal(isMode({ no_flight: '1' }), true);
  assert.equal(isMode({ no_flight: ['1'] }), true);
  assert.equal(isMode({}), false);
});

check('flights_failed от /packages/flights распознаётся', () => {
  assert.match(offer, /export function isFlightsFailedError\(err: unknown\): boolean/);
  assert.match(offer, /=== 'flights_failed'/);
});

check('«Что входит» без перелёта: перелёт не входит, трансфер не обещаем', () => {
  assert.match(offer, /options\?: \{ isHotelOnly\?: boolean; noFlight\?: boolean \}/);
  assert.match(offer, /\{ key: 'flight', kind: 'no', title: 'Перелёт', note: 'не входит' \}/);
  assert.match(offer, /note: 'уточните у туроператора'/);
});

check('экран «Перелётов к этому туру нет» с кнопкой «Продолжить без перелёта»', () => {
  assert.match(status, /export function BookingNoFlights\(/);
  assert.match(status, />Перелётов к этому туру нет</);
  assert.match(status, /Продолжить без перелёта/);
  assert.match(status, /export function BookingNoFlightNote\(/);
});

check('/booking: «нет перелётов» → экран no-flights; с no_flight=1 → форма, заказ без flight_pair_id', () => {
  assert.match(booking, /type LoadState = 'loading' \| 'ready' \| 'unavailable' \| 'error' \| 'no-flights';/);
  assert.match(booking, /if \(options\?\.noFlight && isNoFlightsPayload\(payload\)\) return null;/);
  assert.match(booking, /!withoutFlight && isNoFlightsPayload\(e\)\) \{\s*setPackageData\(null\);\s*setUnavailablePackage\(pkg\);\s*setLoadState\('no-flights'\);/);
  assert.match(booking, /getOfferBlockReason\(actualizeResult, \{ noFlight \}\)/, 'перед заказом — тот же режим');
  assert.match(booking, /orderPayload\.flight_pair_id = null;/, 'prebuild без перелёта — flight_pair_id: null');
  assert.match(booking, /noFlight=\{noFlight\}/);
  assert.match(booking, /router\?\.query\?\.no_flight,/);
});

check('без перелёта прогнозный топливный сбор не добавляется', () => {
  assert.match(booking, /return \{ \.\.\.pkg, fuel_charge: toMoney\(pkg\.fuel_charge\), predicted_surcharge: 0, _fees_source: 'package' \};/);
  assert.match(booking, /setPackageData\(withoutFlight \? withoutFlightFees\(pkg\) : resolved\);/);
  assert.match(booking, /const resolved = noFlight\s*\? withoutFlightFees\(actualizeResult\.package\)/);
});

check('карточка заказа: строка «Перелёт — Без перелёта» и плашка', () => {
  assert.match(card, /<p>Перелёт<\/p>\s*<p>Без перелёта<\/p>/);
  assert.match(card, /\{noFlight \? <BookingNoFlightNote datesText=\{noFlightDates\} \/> : null\}/);
  assert.match(card, /getBookingInclusions\(packageData, \{ isHotelOnly, noFlight \}\)/);
});

check('/tickets: нет перелётов → экран вместо пустого списка; переход — после входа', () => {
  assert.match(tickets, /if \(isNoFlightsPayload\(e\)\) \{\s*setNoFlights\(true\);\s*setLoading\(false\);\s*return;\s*\}/);
  assert.match(tickets, /if \(withoutFilters && isFlightsFailedError\(err\)\) \{\s*setNoFlights\(true\);/);
  assert.match(tickets, /if \(!token\) \{\s*setAuthModal\(true\);\s*return;\s*\}\s*router\.push\(href\);/);
  assert.match(tickets, /<BookingNoFlights/);
});

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed ? 1 : 0);
