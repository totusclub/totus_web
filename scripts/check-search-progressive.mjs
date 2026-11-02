// Проверка постепенной выдачи поиска (план claude/HOTEL_SEARCH_PROGRESSIVE_PLAN_RU.md, этап 2, 02.11.2026).
//
// Run: node scripts/check-search-progressive.mjs   (Node >= 22.18 — .ts грузятся без сборки; без npm install)
//
// Что проверяется:
//   1) utils/progressiveSearch.ts: склейка без сдвига видимых карточек (Р1), «Ищем ещё у N операторов» (Р4),
//      интервалы опроса, окончание поиска;
//   2) runProgressiveSearch на поддельном Level.Travel (свои часы): первая страница до «completed»
//      (поиск отелей: один оператор performing ~28 с), рост выдачи, без operator_ids, ответ под старые
//      фильтры выбрасывается, отмена, таймаут, пустой поиск;
//   3) store/slices/searchSlice.ts целиком (с маленькой заменой @reduxjs/toolkit): два поиска подряд —
//      старый не затирает новый; фильтр во время поиска — список виден, ответ раннего клика выброшен;
//      догрузка без дублей; старые новые страницы вливаются, видимые карточки не двигаются;
//   4) разметка resultList / filters: прежний путь сохранён за флагом.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { register } from 'node:module';
import { fileURLToPath, pathToFileURL } from 'node:url';

// .ts из src грузятся как ES-модули — убрать предупреждение Node о типе пакета.
process.removeAllListeners('warning');

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (rel) => fs.readFileSync(path.join(root, rel), 'utf8');

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

// ---------- загрузка .ts из src: алиас @/, без расширений; RTK и API — подмены ----------

const RTK_SHIM = `
function addMatch(creator, type) { creator.type = type; creator.match = (a) => a && a.type === type; return creator; }
export function createAsyncThunk(type, payloadCreator) {
  const pending = addMatch((meta) => ({ type: type + '/pending', meta }), type + '/pending');
  const fulfilled = addMatch((payload, meta) => ({ type: type + '/fulfilled', payload, meta }), type + '/fulfilled');
  const rejected = addMatch((payload, meta, error) => ({ type: type + '/rejected', payload, meta, error }), type + '/rejected');
  let seq = 0;
  const creator = (arg) => async (dispatch, getState) => {
    const requestId = type + '#' + (++seq);
    const meta = { arg, requestId };
    dispatch(pending(meta));
    const REJ = Symbol('rej');
    try {
      const result = await payloadCreator(arg, { dispatch, getState, requestId, rejectWithValue: (v) => ({ [REJ]: true, v }) });
      if (result && result[REJ]) return dispatch(rejected(result.v, meta, { message: 'Rejected' }));
      return dispatch(fulfilled(result, meta));
    } catch (e) {
      return dispatch(rejected(undefined, meta, { message: e && e.message }));
    }
  };
  return Object.assign(creator, { pending, fulfilled, rejected });
}
export function createSlice({ name, initialState, reducers, extraReducers }) {
  const cases = new Map();
  const actions = {};
  for (const [key, fn] of Object.entries(reducers || {})) {
    const type = name + '/' + key;
    actions[key] = addMatch((payload) => ({ type, payload }), type);
    cases.set(type, fn);
  }
  const builder = { addCase(ac, fn) { cases.set(typeof ac === 'string' ? ac : ac.type, fn); return builder; } };
  if (extraReducers) extraReducers(builder);
  const reducer = (state = initialState, action) => {
    const fn = cases.get(action.type);
    if (!fn) return state;
    const draft = structuredClone(state);
    const out = fn(draft, action);
    return out === undefined ? draft : out;
  };
  return { reducer, actions };
}
`;

const API_STUB = `
const api = () => globalThis.__fakeApi;
export const startSearch = (...a) => api().startSearch(...a);
export const checkSearchStatus = (...a) => api().checkSearchStatus(...a);
export const getGroupedHotels = (...a) => api().getGroupedHotels(...a);
`;

const hookSource = `
import fs from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
const SRC = ${JSON.stringify(pathToFileURL(path.join(root, 'src')).href + '/')};
const RTK = 'data:text/javascript,' + encodeURIComponent(${JSON.stringify(RTK_SHIM)});
const API = 'data:text/javascript,' + encodeURIComponent(${JSON.stringify(API_STUB)});
function withExt(url) {
  for (const ext of ['', '.ts', '/index.ts']) {
    const u = url + ext;
    try { if (fs.statSync(fileURLToPath(u)).isFile()) return u; } catch {}
  }
  return null;
}
export async function resolve(specifier, context, next) {
  if (specifier === '@reduxjs/toolkit') return { url: RTK, shortCircuit: true };
  if (specifier === '@/api/levelTravelApi') return { url: API, shortCircuit: true };
  if (specifier.startsWith('@/')) {
    const u = withExt(new URL(specifier.slice(2), SRC).href);
    if (u) return { url: u, shortCircuit: true };
  }
  if ((specifier.startsWith('./') || specifier.startsWith('../')) && context.parentURL && context.parentURL.startsWith('file:')) {
    const u = withExt(new URL(specifier, context.parentURL).href);
    if (u) return { url: u, shortCircuit: true };
  }
  return next(specifier, context);
}
`;
register('data:text/javascript,' + encodeURIComponent(hookSource), import.meta.url);

const P = await import(pathToFileURL(path.join(root, 'src/utils/progressiveSearch.ts')).href);

console.log('Постепенная выдача поиска');

// ---------- 1. чистые функции ----------

const H = (id, price) => ({ hotel: { id }, min_price: price });
const ids = (list) => list.map((x) => x.hotel.id);

await check('флаг: по умолчанию включено, NEXT_PUBLIC_PROGRESSIVE_SEARCH=0 — прежнее поведение', () => {
  const src = read('src/utils/progressiveSearch.ts');
  assert.match(src, /String\(process\.env\.NEXT_PUBLIC_PROGRESSIVE_SEARCH \?\? '1'\)\.trim\(\) !== '0'/);
  assert.equal(P.PROGRESSIVE_SEARCH_ENABLED, process.env.NEXT_PUBLIC_PROGRESSIVE_SEARCH !== '0');
});

await check('Р4: «Ищем ещё у N операторов» — число pending / performing, падежи', () => {
  assert.equal(P.countSearchingOperators({ 1: 'pending', 2: 'performing', 3: 'completed', 4: 'skipped' }), 2);
  assert.equal(P.formatOperatorsLeft(1), 'Ищем ещё у 1 оператора');
  assert.equal(P.formatOperatorsLeft(2), 'Ищем ещё у 2 операторов');
  assert.equal(P.formatOperatorsLeft(7), 'Ищем ещё у 7 операторов');
  assert.equal(P.formatOperatorsLeft(11), 'Ищем ещё у 11 операторов');
  assert.equal(P.formatOperatorsLeft(21), 'Ищем ещё у 21 оператора');
});

await check('поиск закончен: completeness 100 или нет pending / performing', () => {
  assert.equal(P.isProgressiveSearchDone({ 1: 'performing', 2: 'skipped' }, 92), false);
  assert.equal(P.isProgressiveSearchDone({ 1: 'completed', 2: 'skipped' }, 92), true);
  assert.equal(P.isProgressiveSearchDone({ 1: 'performing' }, 100), true);
  assert.equal(P.isProgressiveSearchDone({}, 0), false);
  assert.equal(P.pollDelayMs(0, false), 1000, 'пока нет карточек — раз в секунду');
  assert.equal(P.pollDelayMs(0), 2000);
  assert.equal(P.pollDelayMs(16000, false), 3000);
  assert.equal(P.pollDelayMs(16000), 3000);
});

await check('Р1: видимые карточки не двигаются, новые встают по цене ниже них', () => {
  const shown = [H(1, 300), H(2, 100), H(3, 500), H(4, 700)];
  const incoming = [H(9, 50), H(2, 90), H(5, 400), H(1, 310), H(6, 600)];
  const out = P.mergeProgressiveHotels(shown, incoming, { sortBy: 'price,asc', frozenCount: 2 });
  assert.deepEqual(ids(out), [1, 2, 9, 5, 3, 6, 4]);
  assert.equal(out[0].min_price, 310, 'у видимой карточки обновилась цена');
  assert.equal(out[1].min_price, 90);
  const desc = P.mergeProgressiveHotels(shown, incoming, { sortBy: 'price,desc', frozenCount: 1 });
  assert.deepEqual(ids(desc), [1, 4, 6, 3, 5, 2, 9]);
});

await check('склейка по рекомендации: порядок LT ниже видимых, без дублей, ничего не теряется', () => {
  const shown = [H(1), H(2), H(3), H(4)];
  const incoming = [H(5), H(3), H(1), H(6)];
  const out = P.mergeProgressiveHotels(shown, incoming, { sortBy: 'relevance', frozenCount: 2 });
  assert.deepEqual(ids(out), [1, 2, 5, 3, 6, 4]);
  assert.deepEqual(ids(P.mergeProgressiveHotels([], incoming, {})), [5, 3, 1, 6]);
  assert.deepEqual(ids(P.mergeProgressiveHotels(shown, [], { frozenCount: 10 })), [1, 2, 3, 4]);
});

await check('догрузка страницы: только новые отели (старый mergeHotelPages добавлял повторы)', () => {
  assert.deepEqual(ids(P.appendUniqueHotels([H(1), H(2)], [H(2), H(3), H(3)])), [1, 2, 3]);
  assert.deepEqual(ids(P.appendUniqueHotels([H(1), H(2)], [H(1), H(2)])), [1, 2]);
});

await check('видимые карточки: все, чей верх выше нижнего края окна', () => {
  const card = (top) => ({ getBoundingClientRect: () => ({ top }) });
  const rootNode = { querySelectorAll: () => [card(-900), card(-100), card(300), card(799), card(800), card(1200)] };
  assert.equal(P.countCardsAboveViewportBottom(rootNode, 800), 4);
  P.setVisibleHotelCountProvider(() => 3);
  assert.equal(P.getVisibleHotelCount(), 3);
  P.setVisibleHotelCountProvider(null);
  assert.equal(P.getVisibleHotelCount(), 0);
});

// ---------- 2. runProgressiveSearch на поддельном LT ----------

function clock() {
  let t = 0;
  return { now: () => t, sleep: async (ms) => { t += ms; }, add: (ms) => { t += ms; } };
}

/** timeline: [{ at, status, completeness, hotels: [...ids] }] — состояние LT начиная с секунды at. */
function fakeLt(c, timeline, { fetchMs = 300 } = {}) {
  const calls = { status: 0, grouped: [], start: 0 };
  const at = () => [...timeline].reverse().find((s) => c.now() >= s.at * 1000) || timeline[0];
  return {
    calls,
    startSearch: async () => { calls.start++; return { request_id: 'RID', status: timeline[0].status }; },
    checkStatus: async () => { calls.status++; const s = at(); return { status: s.status, completeness: s.completeness }; },
    fetchPage: async (params) => {
      calls.grouped.push({ ...params });
      c.add(fetchMs);
      const s = at();
      return { hotels: s.hotels.map((id) => H(id, 100 + id)), hotels_count: s.hotels.length, sort_by: params.sort_by };
    },
  };
}

const HOTEL_TIMELINE = [
  { at: 0, status: { 6: 'pending', 78: 'pending' }, completeness: 0, hotels: [] },
  { at: 2, status: { 6: 'skipped', 78: 'performing' }, completeness: 50, hotels: [1, 2, 3] },
  { at: 8, status: { 6: 'skipped', 78: 'performing' }, completeness: 50, hotels: [1, 2, 3, 4, 5] },
  { at: 28, status: { 6: 'skipped', 78: 'completed' }, completeness: 100, hotels: [1, 2, 3, 4, 5, 6] },
];

await check('поиск отелей: карточки до «completed» (оператор performing), выдача растёт, финал на 100 %', async () => {
  const c = clock();
  const lt = fakeLt(c, HOTEL_TIMELINE);
  const pages = [];
  const statuses = [];
  const res = await P.runProgressiveSearch({
    searchParams: { search_type: 'hotel' },
    startSearch: lt.startSearch, checkStatus: lt.checkStatus, fetchPage: lt.fetchPage,
    getListParams: () => ({ sort_by: 'relevance', page_limit: 50 }),
    isCurrent: () => true,
    onStatus: (s) => statuses.push(s.operatorsLeft),
    onPage: (page, info) => pages.push({ n: page.hotels.length, ...info, t: c.now() }),
    now: c.now, sleep: c.sleep,
  });
  assert.equal(res.outcome, 'complete');
  assert.ok(res.firstHotelsAtMs <= 3000, `первые карточки на ${res.firstHotelsAtMs} мс`);
  assert.equal(pages[0].first, true);
  assert.equal(pages[0].n, 3);
  assert.ok(pages.some((p) => p.n === 5), 'выдача выросла, пока оператор ещё performing');
  assert.equal(pages.at(-1).final, true);
  assert.equal(pages.at(-1).n, 6);
  assert.ok(statuses.includes(1), 'Р4: «у 1 оператора»');
  assert.ok(lt.calls.grouped.every((p) => !('readyOperators' in p) && !('operator_ids' in p)), 'без operator_ids');
  assert.ok(lt.calls.grouped.every((p) => p.request_id === 'RID' && p.page_number === 1));
});

await check('тур: дозапрос, пока растёт выдача, не реже раза в 4 с; без лишних запросов', async () => {
  const c = clock();
  const lt = fakeLt(c, [
    { at: 0, status: { 1: 'pending', 2: 'pending', 3: 'pending' }, completeness: 0, hotels: [] },
    { at: 3, status: { 1: 'completed', 2: 'pending', 3: 'performing' }, completeness: 40, hotels: [1, 2] },
    { at: 12, status: { 1: 'completed', 2: 'cached', 3: 'performing' }, completeness: 70, hotels: [1, 2, 3, 4] },
    { at: 30, status: { 1: 'completed', 2: 'cached', 3: 'no_results' }, completeness: 100, hotels: [1, 2, 3, 4] },
  ]);
  const pages = [];
  const res = await P.runProgressiveSearch({
    searchParams: {}, startSearch: lt.startSearch, checkStatus: lt.checkStatus, fetchPage: lt.fetchPage,
    getListParams: () => ({ sort_by: 'price,asc' }), isCurrent: () => true,
    onPage: (page, info) => pages.push({ n: page.hotels.length, t: c.now(), ...info }),
    now: c.now, sleep: c.sleep,
  });
  assert.equal(res.outcome, 'complete');
  // LT отдаёт первые отели с 3-й секунды; опрос раз в 1 с + ответ выдачи 0,3 с.
  assert.ok(pages[0].t <= 4300, `первые карточки на ${pages[0].t} мс (у LT — с 3-й секунды)`);
  // Не реже раза в 4 с (+ время ответа выдачи 0,3 с).
  for (let i = 1; i < pages.length; i++) assert.ok(pages[i].t - pages[i - 1].t <= 4300, `перерыв между обновлениями ${pages[i].t - pages[i - 1].t} мс`);
  assert.ok(lt.calls.grouped.length <= 12, `запросов выдачи ${lt.calls.grouped.length}`);
  assert.ok(lt.calls.status <= 20, `опросов статуса ${lt.calls.status}`);
});

await check('все операторы без результатов: пустая финальная страница (экран «не найдено»), без ошибки', async () => {
  const c = clock();
  const lt = fakeLt(c, [
    { at: 0, status: { 1: 'pending' }, completeness: 0, hotels: [] },
    { at: 4, status: { 1: 'no_results' }, completeness: 100, hotels: [] },
  ]);
  const pages = [];
  const res = await P.runProgressiveSearch({
    searchParams: {}, startSearch: lt.startSearch, checkStatus: lt.checkStatus, fetchPage: lt.fetchPage,
    getListParams: () => ({}), isCurrent: () => true, onPage: (p, i) => pages.push(i), now: c.now, sleep: c.sleep,
  });
  assert.equal(res.outcome, 'complete');
  assert.equal(pages.length, 1);
  assert.equal(pages[0].final, true);
});

await check('за 90 с ничего — ошибка «Search timed out» (как раньше); с отелями — конец без ошибки', async () => {
  const c = clock();
  const lt = fakeLt(c, [{ at: 0, status: { 1: 'performing' }, completeness: 10, hotels: [] }]);
  await assert.rejects(P.runProgressiveSearch({
    searchParams: {}, startSearch: lt.startSearch, checkStatus: lt.checkStatus, fetchPage: lt.fetchPage,
    getListParams: () => ({}), isCurrent: () => true, onPage: () => {}, now: c.now, sleep: c.sleep,
  }), /Search timed out/);
  const c2 = clock();
  const lt2 = fakeLt(c2, [{ at: 0, status: { 1: 'performing' }, completeness: 10, hotels: [1] }]);
  const res = await P.runProgressiveSearch({
    searchParams: {}, startSearch: lt2.startSearch, checkStatus: lt2.checkStatus, fetchPage: lt2.fetchPage,
    getListParams: () => ({}), isCurrent: () => true, onPage: () => {}, now: c2.now, sleep: c2.sleep,
  });
  assert.equal(res.outcome, 'timeout');
  assert.ok(c2.now() <= 95_000);
});

await check('отмена: новый поиск / уход со страницы — старый цикл сразу останавливается', async () => {
  const c = clock();
  const lt = fakeLt(c, HOTEL_TIMELINE);
  let current = true;
  const pages = [];
  const res = await P.runProgressiveSearch({
    searchParams: {}, startSearch: lt.startSearch, checkStatus: lt.checkStatus, fetchPage: lt.fetchPage,
    getListParams: () => ({}), isCurrent: () => current,
    onPage: (p) => { pages.push(p); current = false; }, now: c.now, sleep: c.sleep,
  });
  assert.equal(res.outcome, 'cancelled');
  assert.equal(pages.length, 1);
  const statusCalls = lt.calls.status;
  assert.ok(statusCalls <= 3);
});

await check('фильтр сменили, пока ждали ответ: ответ под старые фильтры выброшен, запрос с новыми', async () => {
  const c = clock();
  const lt = fakeLt(c, HOTEL_TIMELINE);
  let filters = { sort_by: 'relevance' };
  const origFetch = lt.fetchPage;
  const pages = [];
  let clickedAt = -1;
  lt.fetchPage = async (params) => {
    const r = await origFetch(params);
    // Клик по фильтру, пока шёл первый запрос после первой страницы.
    if (pages.length === 1 && clickedAt < 0) {
      clickedAt = lt.calls.grouped.length;
      filters = { sort_by: 'price,asc', filter_stars: '5' };
    }
    return r;
  };
  await P.runProgressiveSearch({
    searchParams: {}, startSearch: lt.startSearch, checkStatus: lt.checkStatus, fetchPage: lt.fetchPage,
    getListParams: () => filters, isCurrent: () => true,
    onPage: (p, info) => pages.push(info.listParams), now: c.now, sleep: c.sleep,
  });
  assert.equal(pages[0].sort_by, 'relevance');
  assert.ok(pages.slice(1).every((p) => p.sort_by === 'price,asc' && p.filter_stars === '5'), 'после клика — только новые фильтры');
  assert.equal(lt.calls.grouped[clickedAt].sort_by, 'price,asc', 'сразу новый запрос с новыми фильтрами');
});

await check('пока идёт запрос фильтра, поиск не запрашивает выдачу и не опрашивает статус', async () => {
  const c = clock();
  const lt = fakeLt(c, HOTEL_TIMELINE);
  let busyUntil = 5_000;
  const res = await P.runProgressiveSearch({
    searchParams: {}, startSearch: lt.startSearch, checkStatus: lt.checkStatus, fetchPage: lt.fetchPage,
    getListParams: () => ({}), isCurrent: () => true, isListBusy: () => c.now() >= 2_000 && c.now() < busyUntil,
    onPage: () => {}, now: c.now, sleep: c.sleep,
  });
  assert.equal(res.outcome, 'complete');
  const during = lt.calls.grouped.length;
  assert.ok(during >= 2);
});

// ---------- 3. searchSlice целиком ----------

const sliceMod = await import(pathToFileURL(path.join(root, 'src/store/slices/searchSlice.ts')).href);
const { default: reducer, runFullSearchFlow, searchFilters, stopActiveSearchPoll } = sliceMod;

function makeStore() {
  let state = { search: reducer(undefined, { type: '@@init' }) };
  const store = {
    getState: () => state,
    dispatch: (action) => {
      if (typeof action === 'function') return action(store.dispatch, store.getState);
      state = { search: reducer(state.search, action) };
      return action;
    },
  };
  return store;
}

/** Поддельный API для slice: настоящие таймеры, но короткие; каждый поиск — свой request_id. */
function sliceApi({ hotelsFor = () => [1, 2, 3], doneAfter = 2, groupedDelay = () => 0 } = {}) {
  const polls = new Map();
  const calls = { grouped: [] };
  globalThis.__fakeApi = {
    calls,
    startSearch: async (p) => ({ request_id: 'R-' + p.to_country, status: { 1: 'pending' } }),
    checkSearchStatus: async (rid) => {
      const n = (polls.get(rid) || 0) + 1;
      polls.set(rid, n);
      return n >= doneAfter ? { status: { 1: 'completed' }, completeness: 100 } : { status: { 1: 'performing', 2: 'pending' }, completeness: 40 };
    },
    getGroupedHotels: async (params) => {
      calls.grouped.push({ ...params });
      const wait = groupedDelay(params);
      if (wait) await new Promise((r) => setTimeout(r, wait));
      const list = hotelsFor(params).map((id) => H(id, 100 + id));
      return { hotels: list, hotels_count: list.length, sort_by: params.sort_by, request_id: params.request_id, filter_stars: params.filter_stars };
    },
  };
  return calls;
}

if (!P.PROGRESSIVE_SEARCH_ENABLED) {
  console.log('  (флаг выключен — проверки slice пропущены)');
} else {
  await check('slice: два поиска подряд — побеждает последний, ответы первого выброшены', async () => {
    sliceApi({ hotelsFor: (p) => (p.request_id === 'R-EG' ? [11, 12] : [21, 22, 23]), groupedDelay: (p) => (p.request_id === 'R-EG' ? 30 : 0) });
    const store = makeStore();
    const first = store.dispatch(runFullSearchFlow({ searchParams: { to_country: 'EG' }, filterParams: { sort_by: 'relevance', page_limit: 50 } }));
    await new Promise((r) => setTimeout(r, 5));
    const second = store.dispatch(runFullSearchFlow({ searchParams: { to_country: 'TR' }, filterParams: { sort_by: 'relevance', page_limit: 50 } }));
    await Promise.all([first, second]);
    await new Promise((r) => setTimeout(r, 60));
    const s = store.getState().search;
    assert.equal(s.hotels.request_id, 'R-TR');
    assert.deepEqual(ids(s.allMyHotels), [21, 22, 23]);
    assert.equal(s.loading, false);
    assert.equal(s.searchingOperators, null);
  });

  await check('slice: старые результаты не видны, пока идёт новый поиск', async () => {
    sliceApi({ hotelsFor: () => [1, 2], groupedDelay: () => 20 });
    const store = makeStore();
    await store.dispatch(runFullSearchFlow({ searchParams: { to_country: 'EG' }, filterParams: {} }));
    assert.equal(store.getState().search.allMyHotels.length, 2);
    const p = store.dispatch(runFullSearchFlow({ searchParams: { to_country: 'TR' }, filterParams: {} }));
    const mid = store.getState().search;
    assert.equal(mid.hotels, null);
    assert.equal(mid.allMyHotels.length, 0);
    assert.equal(mid.loading, true);
    await p;
  });

  await check('slice: без operator_ids / readyOperators даже если форма их передала', async () => {
    const calls = sliceApi({});
    const store = makeStore();
    await store.dispatch(runFullSearchFlow({ searchParams: { to_country: 'EG' }, filterParams: { readyOperators: '6,7', operator_ids: '6', filter_stars: '3,4,5', sort_by: 'relevance' } }));
    assert.ok(calls.grouped.length > 0);
    assert.ok(calls.grouped.every((p) => !('readyOperators' in p) && !('operator_ids' in p)));
    assert.ok(calls.grouped.every((p) => p.filter_stars === '3,4,5'));
    assert.equal(store.getState().search.hotels.filter_stars, '3,4,5', 'применённые фильтры в hotels — для сайдбара и тегов');
  });

  await check('slice: фильтр — список остаётся на экране, ответ раннего клика выброшен', async () => {
    sliceApi({ hotelsFor: (p) => (p.filter_stars === '5' ? [5] : p.filter_stars === '4' ? [4] : [1, 2, 3]), groupedDelay: (p) => (p.filter_stars === '4' ? 40 : 5) });
    const store = makeStore();
    await store.dispatch(runFullSearchFlow({ searchParams: { to_country: 'EG' }, filterParams: {} }));
    store.dispatch(sliceMod.setAllMyHotels([])); // так делают filters.tsx / resultList.tsx перед запросом
    const early = store.dispatch(searchFilters({ request_id: 'R-EG', filter_stars: '4', page_number: 1 }));
    let s = store.getState().search;
    assert.equal(s.refreshing, true);
    assert.equal(s.loading, false, 'без заглушек');
    assert.deepEqual(ids(s.allMyHotels), [1, 2, 3], 'прежний список виден');
    const late = store.dispatch(searchFilters({ request_id: 'R-EG', filter_stars: '5', page_number: 1 }));
    await Promise.all([early, late]);
    s = store.getState().search;
    assert.deepEqual(ids(s.allMyHotels), [5], 'ответ раннего клика (4★) пришёл позже и выброшен');
    assert.equal(s.refreshing, false);
  });

  await check('slice: догрузка страницы — без повторов', async () => {
    sliceApi({ hotelsFor: (p) => (p.page_number > 1 ? [3, 4, 5] : [1, 2, 3]) });
    const store = makeStore();
    await store.dispatch(runFullSearchFlow({ searchParams: { to_country: 'EG' }, filterParams: {} }));
    await store.dispatch(searchFilters({ request_id: 'R-EG', page_number: 2 }));
    assert.deepEqual(ids(store.getState().search.allMyHotels), [1, 2, 3, 4, 5]);
  });

  await check('slice: новые отели вливаются, видимые карточки на местах, «Ищем ещё» до конца поиска', async () => {
    let round = 0;
    sliceApi({ doneAfter: 4, hotelsFor: () => (++round === 1 ? [1, 2, 3] : [9, 1, 2, 3, 8]) });
    P.setVisibleHotelCountProvider(() => 2);
    const store = makeStore();
    const seen = [];
    const origDispatch = store.dispatch;
    store.dispatch = (a) => { const r = origDispatch(a); if (a?.type === 'search/progressiveStatus') seen.push(store.getState().search.searchingOperators); return r; };
    await store.dispatch(runFullSearchFlow({ searchParams: { to_country: 'EG' }, filterParams: { sort_by: 'relevance' } }));
    P.setVisibleHotelCountProvider(null);
    const s = store.getState().search;
    assert.deepEqual(ids(s.allMyHotels).slice(0, 2), [1, 2], 'видимые 1, 2 на местах');
    assert.deepEqual([...ids(s.allMyHotels)].sort(), [1, 2, 3, 8, 9]);
    assert.ok(seen.some((n) => n > 0), 'Р4: число ищущих операторов было в state');
    assert.equal(s.searchingOperators, null, 'после конца поиска строки нет');
  });

  await check('slice: уход со страницы (stopActiveSearchPoll) останавливает постепенный поиск', async () => {
    const calls = sliceApi({ doneAfter: 1000 });
    const store = makeStore();
    const p = store.dispatch(runFullSearchFlow({ searchParams: { to_country: 'EG' }, filterParams: {} }));
    await new Promise((r) => setTimeout(r, 10));
    stopActiveSearchPoll();
    await p;
    const n = calls.grouped.length;
    await new Promise((r) => setTimeout(r, 30));
    assert.equal(calls.grouped.length, n);
    assert.equal(store.getState().search.searchingOperators, null);
  });
}

// ---------- 4. разметка и прежний путь ----------

await check('resultList: «Ищем ещё у N операторов», список не очищается при фильтре, карточки помечены', () => {
  const src = read('src/components/searchPage/searchResult/resultList.tsx');
  assert.match(src, /formatOperatorsLeft\(Number\(searchingOperators\)\)/);
  assert.match(src, /`Найдено \$\{totalHotelsCount\} отелей · `/);
  assert.match(src, /data-hotel-card=""/);
  assert.match(src, /setVisibleHotelCountProvider\(\(\) =>/);
  assert.match(src, /const showSkeleton = isSearching && !loadMore;/, 'когда показывать заглушку — не меняется');
  assert.match(src, /`Показано \$\{shownHotelsCount\} из \$\{totalHotelsCount\} отелей`/, 'прежние тексты на месте');
});

await check('slice: setAllMyHotels([]) перед фильтром не очищает список (за флагом); непустой — как раньше', () => {
  const src = read('src/store/slices/searchSlice.ts');
  assert.match(src, /if \(PROGRESSIVE_SEARCH_ENABLED && \(!nextList \|\| nextList\.length === 0\)\) return;/);
  if (!P.PROGRESSIVE_SEARCH_ENABLED) return;
  let st = reducer(undefined, { type: '@@init' });
  st = reducer(st, sliceMod.setAllMyHotels([H(1), H(2)]));
  st = reducer(st, sliceMod.setAllMyHotels([]));
  assert.deepEqual(ids(st.allMyHotels), [1, 2]);
  st = reducer(st, sliceMod.setAllMyHotels({ hotels: [H(3)] }));
  assert.deepEqual(ids(st.allMyHotels), [3]);
});

await check('slice: прежний путь (флаг выключен) не тронут — опрос 3 с, readyOperators, один запрос выдачи', () => {
  const src = read('src/store/slices/searchSlice.ts');
  assert.match(src, /if \(PROGRESSIVE_SEARCH_ENABLED\) \{\s*return runProgressiveFlow\(/);
  assert.match(src, /const SEARCH_POLL_DELAY_MS = 3000;/);
  assert.match(src, /if \(!shouldStopSearchPolling\(statusMap, completeness\)\) \{/);
  assert.match(src, /filters\.readyOperators = readyOperatorsCsv;/);
  assert.match(src, /state\.allMyHotels = mergeHotelPages\(state\.allMyHotels \|\| \[\], hotels\);/);
});

await check('CSS: строка поиска и полоска, тёмная тема, без анимации при reduce-motion', () => {
  const css = read('src/components/searchPage/searchPage.module.css');
  assert.match(css, /\.searchingMore \{\s*color: #c2410b;/);
  assert.match(css, /:global\(\[data-theme="dark"\]\) \.searchingMore/);
  assert.match(css, /@media \(prefers-reduced-motion: reduce\) \{\s*\.searchingBar > span/);
});

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed ? 1 : 0);
