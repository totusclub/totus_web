// Футер: RuStore, Google Play и App Store — ссылки на страницы приложения Totus Club
// (решение владельца 04.11.2026), вид — вариант E макета «список со стрелкой».
// Запуск: node scripts/check-footer-stores.mjs
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (rel) => readFileSync(path.join(root, rel), 'utf8');

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

const footer = read('src/components/footer/index.tsx');
const css = read('src/components/footer/footer.module.css');

const STORES = [
  ['ruStore', 'RuStore', 'Android', 'https://www.rustore.ru/catalog/app/com.totus.com'],
  ['googlePlay', 'Google Play', 'Android', 'https://play.google.com/store/apps/details?id=com.totus.com'],
  ['appStore', 'App Store', 'iPhone и iPad', 'https://apps.apple.com/am/app/totus-club/id6748902937'],
];

console.log('Футер: ссылки на магазины приложений (вариант E)');

check('адреса страниц приложения в магазинах', () => {
  for (const [key, , , url] of STORES) {
    assert.ok(footer.includes(`${key}: '${url}',`), `${key}: ${url}`);
  }
});

check('каждая строка — ссылка в новой вкладке: значок, название, платформа, стрелка', () => {
  for (const [key, title, platform] of STORES) {
    const re = new RegExp(
      `<a href=\\{STORE_URLS\\.${key}\\} target="_blank" rel="noopener noreferrer" className=\\{styles\\.storeRow\\} aria-label="Totus Club в ${title}">\\s*` +
        `<span className=\\{styles\\.storeTile\\}>\\s*<Icon name=\\{'${key}'\\} />\\s*</span>\\s*` +
        `<span className=\\{styles\\.storeText\\}>\\s*<span className=\\{styles\\.storeName\\}>${title}</span>\\s*` +
        `<span className=\\{styles\\.storePlatform\\}>${platform}</span>\\s*</span>\\s*<StoreArrow />\\s*</a>`,
    );
    assert.match(footer, re, key);
  }
});

check('порядок: RuStore, Google Play, App Store', () => {
  const order = [...footer.matchAll(/<Icon name=\{'(ruStore|googlePlay|appStore)'\} \/>/g)].map((m) => m[1]);
  assert.deepEqual(order, ['ruStore', 'googlePlay', 'appStore']);
});

check('стрелка — декоративная (aria-hidden), цвет из темы', () => {
  assert.match(footer, /function StoreArrow\(\)[\s\S]*?<svg className=\{styles\.storeArrow\}[^>]*stroke="currentColor"[^>]*aria-hidden="true">/);
});

check('стили: строки 56 px на фоне bgSecondary, плитка 40 px, наведение и фокус, тёмная тема', () => {
  assert.match(css, /\.storeList\{\s*display: flex;\s*flex-direction: column;\s*gap: 8px;\s*width: 100%;\s*max-width: 300px;/);
  assert.match(css, /\.storeRow\{\s*height: 56px;[\s\S]*?background: var\(--bgSecondary\);[\s\S]*?text-decoration: none;/);
  assert.match(css, /\.storeRow:hover\{\s*background: var\(--hoverPrimary\);/);
  assert.match(css, /\.storeRow:focus-visible\{\s*outline: 2px solid var\(--textPrimary\);/);
  assert.match(css, /\.storeTile\{\s*width: 40px;\s*height: 40px;[\s\S]*?background: var\(--bgPrimary\);/);
  assert.match(css, /:global\(\[data-theme="dark"\]\) \.storeTile\{\s*background: var\(--bgActive\);/);
  assert.match(css, /:global\(\[data-theme="dark"\]\) \.storeTile svg\{\s*filter: invert\(1\);/);
  assert.match(css, /\.storePlatform\{[\s\S]*?color: var\(--textSecondary\);/);
});

check('телефон: строки на всю ширину', () => {
  assert.match(css, /@media \(max-width: 1024px\)[\s\S]*\.storeList\{\s*max-width: none;/);
});

check('старых квадратных плиток без подписей не осталось', () => {
  assert.ok(!/className=\{styles\.stores\}/.test(footer));
  assert.ok(!/a\.storeTile/.test(css));
  assert.ok(!/\.stores\{/.test(css));
});

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed ? 1 : 0);
