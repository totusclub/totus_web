// Поле «Страна, город, регион или отель»: список стран сразу по нажатию, картинки стран — свои.
// Запуск: node scripts/check-where-to-list.mjs (без npm install).
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

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

const utilSrc = read('src/utils/countryImages.ts');
const where = code(read('src/components/search/whereTo.tsx'));
const css = read('src/components/search/search.module.css');
const cfg = code(read('next.config.ts'));

// src/utils/countryImages.ts без аннотаций типов → модуль JS (функции проверяются по-настоящему)
const js = code(utilSrc)
  .replace(/export type BrowseCountry = \{[^}]*\};/, '')
  .replace(/\(iso2: unknown\): string/, '(iso2)')
  .replace(/\(body: unknown\): BrowseCountry\[\] \| null/, '(body)')
  .replace(/\(body as \{ countries\?: unknown \}\)/, 'body')
  .replace(/\(c: any\)/, '(c)')
  .replace(/\(list: BrowseCountry\[\]\): \{ popular: BrowseCountry\[\]; other: BrowseCountry\[\] \}/, '(list)')
  .replace(/export const DEFAULT_BROWSE_COUNTRIES: BrowseCountry\[\]/, 'export const DEFAULT_BROWSE_COUNTRIES')
  .replace(/ as (string|number)/g, '');
const mod = await import('data:text/javascript;base64,' + Buffer.from(js).toString('base64'));

console.log('Поле «Куда»: список по нажатию и картинки стран');

await check('картинка есть у каждой страны списка; файл — маленький SVG с WebP внутри', () => {
  const files = fs.readdirSync(path.join(root, 'public/countries')).filter((f) => f.endsWith('.svg'));
  assert.equal(files.length, mod.COUNTRY_IMAGE_ISO2.size, 'файлов столько же, сколько стран в наборе');
  for (const c of mod.DEFAULT_BROWSE_COUNTRIES) {
    assert.ok(mod.COUNTRY_IMAGE_ISO2.has(c.iso2), `нет картинки: ${c.name}`);
    const svg = read(`public/countries/${c.iso2}.svg`);
    assert.match(svg, /^<svg xmlns="http:\/\/www\.w3\.org\/2000\/svg" width="80" height="80" viewBox="0 0 80 80"><image width="80" height="80" href="data:image\/webp;base64,[A-Za-z0-9+/=]+"\/><\/svg>\n$/);
    assert.ok(svg.length < 4096, `${c.iso2}.svg больше 4 КБ: ${svg.length}`);
  }
  const total = files.reduce((n, f) => n + fs.statSync(path.join(root, 'public/countries', f)).size, 0);
  assert.ok(total < 150 * 1024, `все картинки вместе < 150 КБ (сейчас ${Math.round(total / 1024)} КБ)`);
});

await check('countryImageSrc: свой путь по ISO2; неизвестная страна — пусто (буква)', () => {
  assert.equal(mod.countryImageSrc('tr'), '/countries/TR.svg');
  assert.equal(mod.countryImageSrc('EG'), '/countries/EG.svg');
  assert.equal(mod.countryImageSrc('XX'), '');
  assert.equal(mod.countryImageSrc(null), '');
});

await check('справочник → популярные (priority > 1, по убыванию) и остальные (по алфавиту)', () => {
  const list = mod.toBrowseCountries({ countries: [
    { id: 1, name_ru: 'Абхазия', iso2: 'AB', priority: 1 },
    { id: 2, name_ru: 'Египет', iso2: 'EG', priority: 9 },
    { id: 3, name_ru: 'Турция', iso2: 'TR', priority: 10 },
    { id: 4, name_ru: 'Италия', iso2: 'IT', priority: 0 },
    { id: 5, name_ru: '', iso2: 'ZZ', priority: 5 },
  ] });
  assert.equal(list.length, 4, 'страна без названия отброшена');
  const { popular, other } = mod.splitBrowseCountries(list);
  assert.deepEqual(popular.map((c) => c.iso2), ['TR', 'EG']);
  assert.deepEqual(other.map((c) => c.iso2), ['AB', 'IT']);
  assert.equal(mod.toBrowseCountries({ success: false }), null);
  assert.equal(mod.toBrowseCountries({ countries: [] }), null);
  const def = mod.splitBrowseCountries(mod.DEFAULT_BROWSE_COUNTRIES);
  assert.deepEqual(def.popular.slice(0, 5).map((c) => c.name), ['Турция', 'Египет', 'Вьетнам', 'Россия', 'ОАЭ']);
  assert.equal(def.popular.length + def.other.length, 57);
});

await check('по нажатию: страны из /references/destinations (до ответа — встроенный список), без пустого autocomplete', () => {
  assert.match(where, /useState<BrowseCountry\[\]>\(DEFAULT_BROWSE_COUNTRIES\)/);
  assert.match(where, /fetch\(`\$\{API_BASE_URL\}\/references\/destinations\?from_city=\$\{encodeURIComponent\(key\)\}`\)/);
  assert.match(where, /loadBrowseCountries\(fromCity\)\.then\(\(list\) => \{\s*if \(!cancelled && list\) setBrowseCountries\(list\);/);
  assert.ok(!/query: ' ',/.test(where), 'нет запроса подсказок с пустым текстом');
  assert.match(where, /if \(!isTypingSearch\) return browseSplit\.popular;/);
  assert.match(where, /const getOtherCountries = \(\): DestinationItem\[\] => \(isTypingSearch \? \[\] : browseSplit\.other\);/);
  assert.match(where, /const searchGroups: unknown\[\] = isTypingSearch && Array\.isArray\(data\) \? data : \[\];/);
  assert.equal((where.match(/\{searchGroups\s*\.filter/g) || []).length, 3, 'курорты, мегарегионы, отели — только при вводе');
});

await check('картинки стран — свои (ссылки Level.Travel не используются), lazy; нет картинки — буква', () => {
  assert.equal((where.match(/<CountryAvatar iso2=\{c\.iso2\} name=/g) || []).length, 2);
  assert.match(where, /<img src=\{src\} alt="" width=\{40\} height=\{40\} loading="lazy" decoding="async"/);
  assert.match(where, /\(name \|\| '\?'\)\.trim\(\)\.charAt\(0\)\.toUpperCase\(\)/);
  assert.ok(!/src=\{c\.image\}/.test(where.slice(0, where.indexOf('"regions"'))), 'у стран нет c.image');
  assert.match(css, /\.destinationImageImg \{[^}]*width: 40px;[^}]*object-fit: cover;/);
  assert.match(css, /\.destinationImageLetter \{[^}]*color: var\(--primary_orange\);/);
  assert.match(cfg, /source: '\/countries\/:file\*'/);
  assert.match(cfg, /value: 'public, max-age=2592000, stale-while-revalidate=86400'/);
});

await check('телефон: курсор в поле окна, подсказка «Страна, курорт или отель»', () => {
  assert.match(where, /ref=\{modalInputRef\}/);
  assert.match(where, /placeholder="Страна, курорт или отель"/);
  assert.ok(!/placeholder="Москва"/.test(where));
  assert.match(where, /if \(modalInput && modalInput\.offsetParent !== null && document\.activeElement !== modalInput\) \{\s*modalInput\.focus\(\);/);
  assert.match(where, /return modalInput && modalInput\.offsetParent !== null \? modalInput : inputRef\.current;/);
});

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed ? 1 : 0);
