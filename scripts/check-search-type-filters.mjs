// Фильтры тура и отеля раздельно; переключателя «Тур / Отель» на выдаче нет
// (план claude/HOTEL_SEARCH_PROGRESSIVE_PLAN_RU.md, этап 3; решение владельца 02.11.2026 после #100).
//
// Run: node scripts/check-search-type-filters.mjs   (Node >= 22.18 — .ts грузятся без сборки; без npm install)
//
// Что проверяется:
//   1) utils/searchListState.ts: снимок фильтров отдаётся только поиску того же типа —
//      фильтры тура не применяются к поиску отелей и наоборот; снимок неизвестного типа — без фильтров;
//   2) форма поиска и сайдбар фильтров читают снимок только через readSearchListStateFor;
//   3) переключателя на выдаче нет (ни в шапке, ни над списком); главная с вкладками не тронута;
//   4) остальное из этапа 3: поле «Куда» из адреса, отель без города вылета, фильтры отеля.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

process.removeAllListeners('warning');

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (rel) => fs.readFileSync(path.join(root, rel), 'utf8');
const exists = (rel) => fs.existsSync(path.join(root, rel));

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

// sessionStorage в Node — для utils/searchListState.ts.
const store = new Map();
globalThis.window = globalThis;
globalThis.sessionStorage = {
  getItem: (k) => (store.has(k) ? store.get(k) : null),
  setItem: (k, v) => store.set(k, String(v)),
  removeItem: (k) => store.delete(k),
};

const S = await import(pathToFileURL(path.join(root, 'src/utils/searchListState.ts')).href);
const Q = await import(pathToFileURL(path.join(root, 'src/utils/searchQuery.ts')).href);

console.log('Фильтры тура и отеля раздельно');

const key = (type) => JSON.stringify({ from_city: 'Moscow', to_country: 'TR', adults: '2', nights: '7', ...(type ? { search_type: type } : {}) });
const TOUR_FILTERS = { filter_meals: 'AI', filter_stars: '3,4,5', filter_pool: true, sort_by: 'price,asc' };

await check('фильтры тура не попадают в поиск отелей; в поиск тура — как раньше', () => {
  store.clear();
  S.writeSearchListState({ autoSearchKey: key('package'), requestId: 'R1', filters: TOUR_FILTERS });
  assert.equal(S.readSearchListStateFor('hotel').filters, undefined);
  assert.deepEqual(S.readSearchListStateFor('package').filters, TOUR_FILTERS);
  assert.deepEqual(S.readSearchListStateFor(undefined).filters, TOUR_FILTERS, 'без search_type — тур');
  assert.equal(S.readSearchListStateFor('hotel').requestId, 'R1', 'остальное в снимке не трогаем');
  assert.deepEqual(S.readSearchListState().filters, TOUR_FILTERS, 'сам снимок не стирается');
});

await check('фильтры отеля не попадают в поиск тура', () => {
  store.clear();
  S.writeSearchListState({ autoSearchKey: key('hotel'), filters: { filter_meals: 'BB' } });
  assert.deepEqual(S.readSearchListStateFor('hotel').filters, { filter_meals: 'BB' });
  assert.equal(S.readSearchListStateFor('package').filters, undefined);
});

await check('снимок неизвестного типа («{}» после главной, битый ключ) — без фильтров', () => {
  store.clear();
  S.writeSearchListState({ autoSearchKey: '{}', filters: TOUR_FILTERS });
  assert.equal(S.searchTypeOfListState(S.readSearchListState()), null);
  assert.equal(S.readSearchListStateFor('package').filters, undefined);
  assert.equal(S.readSearchListStateFor('hotel').filters, undefined);
  S.writeSearchListState({ autoSearchKey: 'not json' });
  assert.equal(S.readSearchListStateFor('package').filters, undefined);
  store.clear();
  assert.equal(S.readSearchListStateFor('package'), null);
  assert.equal(S.searchTypeOfListState(null), null);
  assert.equal(S.searchTypeOfListState({ autoSearchKey: key() }), 'package');
});

await check('форма поиска и сайдбар читают фильтры сессии только своего типа', () => {
  const form = read('src/components/search/searchForm.tsx');
  assert.ok(!/readSearchListState\(\)/.test(form), 'в форме нет чтения снимка без типа');
  assert.match(form, /const saved = readSearchListStateFor\(parsed\.search_type\);/);
  assert.match(form, /\.\.\.\(readSearchListStateFor\(parsed\.search_type\)\?\.filters \?\? \{\}\),/);
  assert.match(form, /: preservedFilters \?\? readSearchListStateFor\(data\.search_type\)\?\.filters;/);
  assert.match(form, /\.\.\.\(readSearchListStateFor\(searchParams\.search_type\)\?\.filters \?\? \{\}\),/);
  const filters = read('src/components/searchPage/searchResult/filters.tsx');
  assert.ok(!/readSearchListState\(\)/.test(filters));
  assert.match(filters, /const saved = readSearchListStateFor\(isHotelSearch \? 'hotel' : 'package'\);/);
});

await check('переключателя «Тур / Отель» на выдаче нет; вкладки главной на месте', () => {
  const form = read('src/components/search/searchForm.tsx');
  assert.ok(!/SearchTypeSwitch/.test(form));
  assert.match(form, /<div className=\{styles\.searchFormBlock\}>\s*\{!header && \(\s*<SearchTypeTabs/);
  const result = read('src/components/searchPage/searchResult/index.tsx');
  assert.ok(!/SearchTypeSwitch/.test(result));
  for (const f of ['src/components/searchPage/searchTypeSwitch/index.tsx', 'src/hooks/useSearchTypeSwitch.ts']) {
    assert.ok(!exists(f), `${f} удалён`);
  }
});

await check('поле «Куда» на /search — страна из адреса (этап 3)', () => {
  const countries = [{ iso2: 'TR', name: 'Турция' }, { iso2: 'EG', name: 'Египет' }];
  assert.equal(Q.destinationLabel({ toCountry: 'TR', headerName: 'Египет', countries }), 'Турция');
  assert.equal(Q.destinationLabel({ toCity: 'Antalya', toCountry: 'TR', headerName: 'Анталья', countries }), 'Antalya');
  assert.equal(Q.destinationLabel({ toCountry: 'ZZ', headerName: 'Страна Z', countries }), 'Страна Z');
  const form = read('src/components/search/searchForm.tsx');
  assert.match(form, /value=\{destinationValue\}/);
});

await check('поиск отелей без города вылета; фильтры отеля без «Прямого перелёта» и 3–5★ по умолчанию', () => {
  const api = read('src/api/levelTravelApi.tsx');
  assert.match(api, /if \(isHotelSearch && \(key === 'from_city' \|\| key === 'from_country'\)\) continue;/);
  const f = read('src/components/searchPage/searchResult/filters.tsx');
  assert.match(f, /\(isHotelSearch \? undefined : DEFAULT_FILTERS\.filter_stars\)/);
  assert.match(f, /if \(isHotelSearch && TOUR_ONLY_FILTER_KEYS\.has\(key\)\) return \[key, undefined\];/);
});

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed ? 1 : 0);
