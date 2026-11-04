// Футер: значки RuStore, Google Play и App Store — ссылки на страницы приложения Totus Club
// (решение владельца 04.11.2026). Запуск: node scripts/check-footer-stores.mjs
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
  ['ruStore', 'RuStore', 'https://www.rustore.ru/catalog/app/com.totus.com'],
  ['googlePlay', 'Google Play', 'https://play.google.com/store/apps/details?id=com.totus.com'],
  ['appStore', 'App Store', 'https://apps.apple.com/am/app/totus-club/id6748902937'],
];

console.log('Футер: ссылки на магазины приложений');

check('адреса страниц приложения в магазинах', () => {
  for (const [key, , url] of STORES) {
    assert.ok(footer.includes(`${key}: '${url}',`), `${key}: ${url}`);
  }
});

check('каждый значок — ссылка в новой вкладке на свой магазин, с именем', () => {
  for (const [key, title] of STORES) {
    const re = new RegExp(
      `<a href=\\{STORE_URLS\\.${key}\\} target="_blank" rel="noopener noreferrer" className=\\{styles\\.storeTile\\} title="${title}" aria-label="Totus Club в ${title}">\\s*<Icon name=\\{'${key}'\\} />\\s*</a>`,
    );
    assert.match(footer, re, key);
  }
});

check('порядок: RuStore, Google Play, App Store', () => {
  const order = [...footer.matchAll(/<Icon name=\{'(ruStore|googlePlay|appStore)'\} \/>/g)].map((m) => m[1]);
  assert.deepEqual(order, ['ruStore', 'googlePlay', 'appStore']);
});

check('значков-картинок без ссылки не осталось', () => {
  assert.ok(!/<span className=\{styles\.storeTile\}/.test(footer));
});

check('стиль: плитки прежние (48×48, фон), у ссылки без подчёркивания, наведение и фокус', () => {
  assert.match(css, /\.storeTile\{\s*width: 48px;\s*height: 48px;/);
  assert.match(css, /a\.storeTile\{\s*text-decoration: none;\s*cursor: pointer;/);
  assert.match(css, /a\.storeTile:hover\{\s*opacity: 0\.8;/);
  assert.match(css, /a\.storeTile:focus-visible\{/);
  assert.match(css, /:global\(\[data-theme="dark"\]\) \.storeTile svg\{\s*filter: invert\(1\);/);
});

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed ? 1 : 0);
