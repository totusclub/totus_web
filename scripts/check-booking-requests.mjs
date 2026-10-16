// /booking: запросы к Level.Travel — таймауты, отмена, выбранный перелёт без полного списка,
// актуальный id пакета из /tickets. Запуск: node scripts/check-booking-requests.mjs
// (Node ≥ 22.18, без npm install). Вёрстка страницы этим PR не меняется.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import module from 'node:module';
import { fileURLToPath, pathToFileURL } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (rel) => fs.readFileSync(path.join(root, rel), 'utf8');
const code = (s) => s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:])\/\/.*$/gm, '$1');

let passed = 0;
let failed = 0;
async function check(name, fn) {
  try {
    await fn();
    passed++;
    console.log(`  ok   ${name}`);
  } catch (e) {
    failed++;
    console.log(`  FAIL ${name}\n       ${e && e.message ? e.message : e}`);
  }
}

if (!process.features?.typescript || typeof module.registerHooks !== 'function') {
  console.log('SKIP: нужен Node ≥ 22.18 (type stripping + module.registerHooks)');
  process.exit(0);
}

// ---- настоящий src/api/levelTravelApi.tsx с подменённым axios -------------------------------
const M = (globalThis.__ltMock = { calls: [], reply: () => ({ data: {} }) });
const MOCKS = {
  axios: `
    const M = globalThis.__ltMock;
    const call = (method) => async (url, a, b) => {
      const config = method === 'get' ? a : b;
      const body = method === 'get' ? undefined : a;
      M.calls.push({ method, url, body, config: config || {} });
      return M.reply({ method, url, body, config: config || {} });
    };
    const axios = { get: call('get'), post: call('post'), isCancel: () => false };
    export default axios;`,
  '@/config/api': `export const API_BASE_URL = 'https://api.test';`,
  '@/utils/searchResults': `export const parseUiPageNumber = (v) => v, toApiPageNumber = (v) => v, toOperatorIdsCsv = (v) => v;`,
  '@/utils/searchStatus': `export const getReadySearchOperators = () => [], shouldStopSearchPolling = () => true;`,
};
const API = path.join(root, 'src/api/levelTravelApi.tsx');
module.registerHooks({
  resolve(specifier, context, next) {
    if (Object.prototype.hasOwnProperty.call(MOCKS, specifier)) return { url: `mock:${specifier}`, shortCircuit: true };
    return next(specifier, context);
  },
  load(url, context, next) {
    if (url.startsWith('mock:')) return { format: 'module', source: MOCKS[url.slice(5)], shortCircuit: true };
    if (url === pathToFileURL(API).href) return { format: 'module-typescript', source: fs.readFileSync(API, 'utf8'), shortCircuit: true };
    return next(url, context);
  },
});
const api = await import(pathToFileURL(API).href);
const last = () => M.calls[M.calls.length - 1];

console.log('Бронирование: запросы к Level.Travel');

await check('таймауты: у шагов бронирования есть, у создания заказа и оплаты — нет (нельзя оформить дважды)', async () => {
  const T = api.LT_CLIENT_TIMEOUT_MS;
  for (const [k, v] of Object.entries(T)) assert.ok(v >= 30000 && v <= 90000, `${k}=${v}`);
  M.calls.length = 0;
  await api.PackagesActualizeFlight(1, 'p');
  assert.equal(last().config.timeout, T.actualize);
  await api.PackagesActualize(1, { search_type: 'hotel' });
  assert.equal(last().config.timeout, T.actualize);
  assert.equal(last().config.params.search_type, 'hotel');
  await api.createPackage({ request_id: 'r', tour_id: 't' });
  assert.equal(last().config.timeout, T.packageDetails);
  await api.prebuildOrder({ package_id: 1 });
  assert.equal(last().config.timeout, T.prebuild);
  await api.prebookPackage({ package_id: 1 });
  assert.equal(last().config.timeout, T.prebook);
  await api.validateTourist({ package_id: 1 });
  assert.equal(last().config.timeout, T.validateTourists);
  await api.Packagesflights({ package_id: 1 });
  assert.equal(last().config.timeout, T.flights);
  await api.createOrder({ package_id: 1 });
  assert.equal(last().config.timeout, undefined, 'create-package без таймаута');
  const src = code(read('src/api/levelTravelApi.tsx'));
  const pay = src.slice(src.indexOf('export async function createPay'), src.indexOf('export async function checkPay'));
  assert.ok(!/timeout/.test(pay), 'vtb/create-order без таймаута');
});

await check('актуализация: signal передаётся (отмена при уходе и смене перелёта)', async () => {
  const c = new AbortController();
  await api.PackagesActualizeFlight(7, 'pair', { signal: c.signal });
  assert.equal(last().config.signal, c.signal);
  assert.deepEqual(last().config.params, { package_id: 7, flight_pair_id: 'pair', search_type: 'package' });
  await api.PackagesActualize(7, { signal: c.signal });
  assert.equal(last().config.signal, c.signal);
  await api.PackagesActualize(7);
  assert.equal('signal' in last().config, false, 'без signal — прежний запрос');
});

await check('выбранный перелёт: один запрос ?view=pair с flight_pair_id, ответ — только этот рейс', async () => {
  M.reply = ({ config }) => ({ data: { success: true, pair_view: true, found: true, flights: [{ flight_pair_id: config.params.flight_pair_id, fuel_charge: 41910 }] } });
  const f = await api.getSelectedFlight('409294734', 'Nzh8MDc4', {});
  assert.equal(f.fuel_charge, 41910);
  assert.equal(last().url, 'https://api.test/packages/flights');
  assert.deepEqual(last().body, { package_id: 409294734 });
  assert.deepEqual(last().config.params, { view: 'pair', flight_pair_id: 'Nzh8MDc4' });
  assert.equal(last().config.timeout, api.LT_CLIENT_TIMEOUT_MS.selectedFlight);
  // массив из query (?flight_pair_id=a&flight_pair_id=a)
  await api.getSelectedFlight(1, ['a', 'a']);
  assert.equal(last().config.params.flight_pair_id, 'a');
});

await check('выбранный перелёт: старый API (полный список) — рейс находится; нет рейса / нет id — null', async () => {
  M.reply = () => ({ data: { success: true, flights: [{ flight_pair_id: 'x', fuel_charge: 1 }, { flight_pair_id: 'y', fuel_charge: 2 }] } });
  assert.equal((await api.getSelectedFlight(1, 'y')).fuel_charge, 2);
  assert.equal(await api.getSelectedFlight(1, 'z'), null);
  const before = M.calls.length;
  assert.equal(await api.getSelectedFlight(1, ''), null);
  assert.equal(M.calls.length, before, 'без flight_pair_id запроса нет');
  await assert.rejects(() => api.getSelectedFlight('abc', 'y'));
});

await check('Packagesflights без изменений: view и signal необязательны, тело прежнее', async () => {
  M.reply = () => ({ data: {} });
  await api.Packagesflights({ package_id: '5', forward_airlines: [] }, { view: 'list' });
  assert.deepEqual(last().body, { package_id: 5 });
  assert.deepEqual(last().config.params, { view: 'list' });
});

// ---- страница бронирования (исходник) -------------------------------------------------------
const booking = code(read('src/components/bookingPage/index.tsx'));
const ticket = code(read('src/components/ticketItem/index.tsx'));
const list = code(read('src/components/searchPage/searchResult/searchTicketList.tsx'));

await check('бронирование: топливный сбор — из одного выбранного перелёта, без полного списка', () => {
  assert.ok(!/Packagesflights/.test(booking), 'полный список перелётов на странице бронирования не запрашивается');
  assert.match(booking, /const selected = await getSelectedFlight\(pkg\.id \|\| pkg\.package_id, pairId, options\);/);
  assert.match(booking, /fuel_charge: toMoney\(selected\?\.fuel_charge\)/);
  assert.match(booking, /if \(packageFuel > 0\) \{\s*return \{ \.\.\.pkg, fuel_charge: packageFuel \};/, 'есть сбор в актуализации — второго запроса нет');
});

await check('бронирование: один запрос на адрес — смена перелёта или уход отменяют прежний, ответ не перетирает', () => {
  assert.match(booking, /const controller = new AbortController\(\);\s*const signal = controller\.signal;/);
  assert.match(booking, /PackagesActualizeFlight\(packageId as any, flightPairId as any, \{ signal \}\)/);
  assert.match(booking, /PackagesActualize\(packageId as any, \{ search_type: 'hotel', signal \}\)/);
  assert.match(booking, /resolvePackageWithFlightFees\(pkg, flightPairId, \{ signal \}\);\s*if \(signal\.aborted\) return;/);
  assert.match(booking, /if \(signal\.aborted \|\| isRequestCancelled\(err\)\) return;\s*setDataLoading\(false\);/);
  assert.match(booking, /return \(\) => controller\.abort\(\);\s*\}, \[/);
});

await check('бронирование: оформление по-прежнему актуализирует перед заказом, selected_extras и шаги без изменений', () => {
  assert.match(booking, /await PackagesActualizeFlight\(packageId as never, flightPairId as never\)/);
  assert.match(booking, /selected_extras: \[\],/);
  for (const s of ['await validateTourist(data)', 'await prebuildOrder(orderPayload)', 'await prebookPackage({', 'createOrder(']) assert.ok(booking.includes(s), s);
});

await check('/tickets → /booking: id пакета после актуализации, а не из адреса', () => {
  assert.match(ticket, /package: packageId \?\? router\.query\.package,/);
  assert.match(ticket, /packageId\?: number \| string \| null/);
  assert.match(list, /<TicketItem key=\{flightKey\(item, index\)\} lazy=\{false\} price=\{packages\.price\} item=\{item\} green=\{index === 0\} packageId=\{packages\?\.id\} \/>/);
});

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed ? 1 : 0);
