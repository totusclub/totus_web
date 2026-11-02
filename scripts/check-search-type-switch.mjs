// Проверка переключателя «Тур / Отель» на странице выдачи (план claude/HOTEL_SEARCH_PROGRESSIVE_PLAN_RU.md,
// этап 3; макет — вариант A, утверждён 02.11.2026; названия и тексты — как сейчас на сайте).
//
// Run: node scripts/check-search-type-switch.mjs   (Node >= 22.18 — .ts грузятся без сборки; без npm install)
//
// Что проверяется:
//   1) utils/searchQuery.ts: смена типа — то же направление, даты, ночи и туристы; фильтры общие (Р2),
//      цена не переносится; «Прямой перелёт» у отеля не применяется, но и не теряется; ключ поиска —
//      по тем же правилам, что в форме (форма не запускает поиск второй раз); поле «Куда» из адреса;
//   2) разметка: переключатель в шапке на компьютере и строкой над выдачей на телефоне, тексты прежние;
//   3) поиск отелей: без города вылета в /start-search, без «Прямого перелёта» и без 3–5★ по умолчанию.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

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

const Q = await import(pathToFileURL(path.join(root, 'src/utils/searchQuery.ts')).href);

console.log('Переключатель «Тур / Отель» на выдаче');

// Адрес /search, как его строит форма (createSearchUrl) — значения строками.
const TOUR_QUERY = {
  from_city: 'Moscow', to_country: 'TR', adults: '2', start_date: '2026-11-25', nights: '7', flex_dates: '0',
  start_date_from: '2026-11-25', end_date_till: '2026-12-02', from_country: 'RU', kids: '1', kids_ages: '5',
  search_type: 'package', page_limit: '50', page_number: '3', sort_by: 'price,asc',
};

await check('тур → отель: то же направление, даты, ночи, туристы; первая страница; без request_id', () => {
  const plan = Q.planSearchTypeSwitch({ query: { ...TOUR_QUERY, request_id: 'OLD' }, nextType: 'hotel', appliedFilters: {} });
  assert.equal(plan.query.search_type, 'hotel');
  assert.equal(plan.query.page_number, '1');
  assert.ok(!('request_id' in plan.query));
  for (const k of ['to_country', 'start_date', 'nights', 'adults', 'kids', 'kids_ages', 'end_date_till', 'sort_by']) {
    assert.equal(plan.query[k], TOUR_QUERY[k], k);
  }
  assert.deepEqual(plan.searchParams.kids_ages, [5]);
  assert.equal(plan.searchParams.search_type, 'hotel');
  assert.equal(plan.searchParams.page_number, 1);
  // Порядок ключей адреса прежний — ключ поиска совпадёт с тем, что форма прочитает из router.query.
  assert.deepEqual(Object.keys(plan.query), Object.keys(TOUR_QUERY));
});

await check('Р2: фильтры и сортировка общие; диапазон цены не переносится', () => {
  const applied = {
    filter_stars: '4,5', filter_meals: 'AI', filter_pool: true, sort_by: 'price,asc',
    filter_price_min: 90000, filter_price_max: 400000, filter_instant_confirm: true,
  };
  const toHotel = Q.planSearchTypeSwitch({ query: TOUR_QUERY, nextType: 'hotel', appliedFilters: applied });
  assert.equal(toHotel.filterParams.filter_stars, '4,5');
  assert.equal(toHotel.filterParams.filter_meals, 'AI');
  assert.equal(toHotel.filterParams.filter_pool, true);
  assert.equal(toHotel.filterParams.filter_instant_confirm, true);
  assert.equal(toHotel.filterParams.sort_by, 'price,asc');
  assert.equal(toHotel.filterParams.page_number, 1);
  assert.ok(!('filter_price_min' in toHotel.filterParams) && !('filter_price_max' in toHotel.filterParams));
  const back = Q.planSearchTypeSwitch({ query: toHotel.query, nextType: 'package', appliedFilters: { filter_stars: '4,5', filter_meals: 'AI' } });
  assert.equal(back.filterParams.filter_stars, '4,5', 'выбранные звёзды не заменяются на 3–5 по умолчанию');
  assert.equal(back.filterParams.filter_meals, 'AI');
});

await check('«Прямой перелёт» у отеля не применяется, при возврате к туру включается снова', () => {
  const toHotel = Q.planSearchTypeSwitch({ query: TOUR_QUERY, nextType: 'hotel', appliedFilters: { filter_direct_flight: true, filter_stars: '5' } });
  assert.ok(!('filter_direct_flight' in toHotel.filterParams));
  assert.deepEqual(toHotel.stashTourOnly, { filter_direct_flight: true });
  const back = Q.planSearchTypeSwitch({ query: toHotel.query, nextType: 'package', appliedFilters: { filter_stars: '5' }, stashedTourOnly: toHotel.stashTourOnly });
  assert.equal(back.filterParams.filter_direct_flight, true);
  assert.equal(back.stashTourOnly, null);
});

await check('значения по умолчанию как у формы: тур — 3–5★, отель — без звёзд; тур без города вылета — Москва', () => {
  const hotelQuery = { to_country: 'EG', adults: '2', start_date: '2026-11-25', nights: '7', search_type: 'hotel' };
  const toTour = Q.planSearchTypeSwitch({ query: hotelQuery, nextType: 'package', appliedFilters: {} });
  assert.equal(toTour.filterParams.filter_stars, '3,4,5');
  assert.equal(toTour.query.from_city, 'Moscow');
  assert.equal(toTour.query.from_country, 'RU');
  const toHotel = Q.planSearchTypeSwitch({ query: TOUR_QUERY, nextType: 'hotel', appliedFilters: {} });
  assert.ok(!('filter_stars' in toHotel.filterParams));
  assert.equal(toHotel.filterParams.sort_by, 'price,asc');
  assert.equal(toHotel.query.from_city, 'Moscow', 'город вылета остаётся в адресе — для возврата к туру');
});

await check('ключ поиска — по правилам формы (без страницы, размера страницы и сортировки)', () => {
  const plan = Q.planSearchTypeSwitch({ query: TOUR_QUERY, nextType: 'hotel', appliedFilters: {} });
  const { page_number, page_limit, sort_by, ...core } = plan.query;
  const expected = JSON.stringify({ ...core, kids_ages: [5] });
  assert.equal(plan.autoSearchKey, expected);
  assert.equal(Q.searchAutoKey({ ...plan.query, page_number: '7', sort_by: 'relevance' }), expected);
  // Форма считает ключ так же — правила не разошлись.
  const form = read('src/components/search/searchForm.tsx');
  assert.match(form, /if \(key === 'kids_ages' \|\| key === 'hotel_ids'\) \{\s*const arrayValues = Array\.isArray\(value\) \? value : \[value\];\s*parsed\[key as keyof SearchParams\] = arrayValues\.map\(Number\);/);
  assert.match(form, /parsed\.search_type = raw === 'hotel' \? 'hotel' : 'package';/);
  assert.match(form, /const \{ page_number, page_limit, sort_by, \.\.\.coreSearchParams \} = parsed as Record<string, unknown>;\s*return JSON\.stringify\(coreSearchParams\);/);
  // Ветка формы, которая не перезапускает уже начатый поиск с тем же ключом.
  assert.match(form, /saved\?\.autoSearchKey === autoSearchKey &&\s*\(loading \|\| Boolean\(hotels\?\.request_id\)\)\s*\) \{\s*return next;/);
});

await check('поле «Куда» на /search: страна из адреса, а не прошлый выбор и не подсказка «Египет»', () => {
  const countries = [{ iso2: 'TR', name: 'Турция' }, { iso2: 'EG', name: 'Египет' }];
  assert.equal(Q.destinationLabel({ toCountry: 'TR', headerName: 'Египет', countries }), 'Турция');
  assert.equal(Q.destinationLabel({ toCountry: 'tr', headerName: '', countries }), 'Турция');
  assert.equal(Q.destinationLabel({ toCity: 'Antalya', toCountry: 'TR', headerName: 'Анталья', countries }), 'Antalya', 'город / отель — как раньше');
  assert.equal(Q.destinationLabel({ toCountry: 'ZZ', headerName: 'Страна Z', countries }), 'Страна Z');
  assert.equal(Q.destinationLabel({ countries }), '');
  const form = read('src/components/search/searchForm.tsx');
  assert.match(form, /const destinationValue = pageName === 'search'\s*\? destinationLabel\(\{/);
  assert.match(form, /: \(params\.to_city \|\| headerName \|\| ''\);/, 'на главной — как раньше');
  assert.match(form, /value=\{destinationValue\}/);
  assert.match(form, /\{pageName === 'search' \? destinationValue : \(headerName \|\| ''\)\}/);
});

await check('разметка: шапка (компьютер) и строка над выдачей (телефон), только на /search', () => {
  const form = read('src/components/search/searchForm.tsx');
  assert.match(form, /\{header && pageName === 'search' && <SearchTypeSwitch variant="header" \/>\}/);
  assert.match(form, /const SearchTypeSwitch = dynamic\(\(\) => import\('@\/components\/searchPage\/searchTypeSwitch'\)\);/, 'отдельный чанк — не в бандле главной');
  assert.match(form, /\{!header && \(\s*<SearchTypeTabs/, 'вкладки главной не тронуты');
  const result = read('src/components/searchPage/searchResult/index.tsx');
  assert.match(result, /\{!tickets && <SearchTypeSwitch variant="mobile" \/>\}/, 'на /tickets переключателя нет');
  const sw = read('src/components/searchPage/searchTypeSwitch/index.tsx');
  assert.match(sw, /role="tablist"/);
  assert.match(sw, /aria-selected=\{active\}/);
  assert.match(sw, /onClick=\{\(\) => switchSearchType\(tab\.id\)\}/);
});

await check('тексты прежние: «Тур» / «Отель», «С перелётом» / «Без перелёта» — как вкладки на главной', () => {
  const sw = read('src/components/searchPage/searchTypeSwitch/index.tsx');
  assert.match(sw, /\{ id: 'package', label: 'Тур', hint: 'С перелётом', icon: 'plane' \}/);
  assert.match(sw, /\{ id: 'hotel', label: 'Отель', hint: 'Без перелёта', icon: 'hotel' \}/);
  const form = read('src/components/search/searchForm.tsx');
  assert.match(form, /\{ id: 'package', label: 'Тур', icon: 'plane' \}/);
  assert.match(form, /\{tab\.id === 'package' \? 'С перелётом' : 'Без перелёта'\}/);
  for (const t of ['Гости', 'Заезд и выезд']) assert.ok(!sw.includes(t) && !form.includes(t), `нет «${t}»`);
});

await check('CSS: шапка — только шире 1024 px, без подсказок до 1280; строка — до 1024 px, 44 px', () => {
  const css = read('src/components/searchPage/searchTypeSwitch/searchTypeSwitch.module.css');
  assert.match(css, /\.mobileTabs \{\s*display: none;/);
  assert.match(css, /@media \(max-width: 1280px\) \{[\s\S]*?\.tabHint \{\s*display: none;/);
  assert.match(css, /@media \(max-width: 1024px\) \{\s*\.headerTabs \{\s*display: none;\s*\}\s*\.mobileTabs \{\s*display: grid;/);
  assert.match(css, /\.mobileTabs \.tab \{\s*height: 44px;/);
  assert.match(css, /\.headerTabs \.tab \{\s*height: 48px;/);
  assert.ok(!/#[0-9a-f]{6}/i.test(css.replace(/\/\*[\s\S]*?\*\//g, '')), 'цвета — переменные темы (тёмная тема)');
  const form = read('src/components/search/searchForm.tsx');
  assert.match(form, /style=\{header && pageName === 'search' \? \{ flexDirection: 'row', alignItems: 'center' \} : undefined\}/);
});

await check('переключение: сначала поиск, потом адрес; ключ в сессии; фильтры только для тура — в стороне', () => {
  const hook = read('src/hooks/useSearchTypeSwitch.ts');
  const iDispatch = hook.indexOf('dispatch(runFullSearchFlow(');
  const iPush = hook.indexOf('router.push(');
  const iKey = hook.indexOf('writeSearchListState({ autoSearchKey: plan.autoSearchKey, requestId: null });');
  assert.ok(iKey > 0 && iDispatch > iKey && iPush > iDispatch, 'ключ → поиск → адрес');
  assert.match(hook, /if \(!router\.isReady \|\| normalizeSearchType\(next\) === searchType\) return;/, 'тот же тип — ничего');
  assert.match(hook, /\.\.\.pickAppliedFiltersFromHotels\(hotels\),\s*\.\.\.\(readSearchListState\(\)\?\.filters \?\? \{\}\),/);
  assert.match(hook, /'kedam_search_tour_only_filters'/);
});

await check('поиск отелей: без города вылета в /start-search; тур — как раньше', () => {
  const api = read('src/api/levelTravelApi.tsx');
  assert.match(api, /const isHotelSearch = raw\.search_type === 'hotel';/);
  assert.match(api, /if \(isHotelSearch && \(key === 'from_city' \|\| key === 'from_country'\)\) continue;/);
});

await check('фильтры отеля: без «Прямого перелёта», без 3–5★ по умолчанию; у тура как раньше', () => {
  const f = read('src/components/searchPage/searchResult/filters.tsx');
  assert.match(f, /const isHotelSearch = router\.query\.search_type === 'hotel';/);
  assert.match(f, /\(isHotelSearch \? undefined : DEFAULT_FILTERS\.filter_stars\)/);
  assert.match(f, /if \(isHotelSearch && TOUR_ONLY_FILTER_KEYS\.has\(key\)\) return \[key, undefined\];/);
  assert.match(f, /\? BOOL_AMENITY_UI\.filter\(\(\{ key \}\) => !TOUR_ONLY_FILTER_KEYS\.has\(key\)\)\s*: BOOL_AMENITY_UI;/);
  assert.match(f, /\{amenityUi\.map\(\(\{ key, apiKey, title \}\) => \{/);
  assert.equal((f.match(/buildFiltersFromHotels\(hotels, isHotelSearch\)/g) || []).length, 3);
  assert.match(f, /filter_stars: '3,4,5',/, 'тур: 3–5★ по умолчанию остаются');
});

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed ? 1 : 0);
