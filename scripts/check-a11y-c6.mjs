// PageSpeed C6 — доступность без видимых изменений. Запуск: node scripts/check-a11y-c6.mjs
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

console.log('Доступность (PageSpeed Accessibility)');

check('meta-viewport: масштаб не запрещён; поля ввода на телефоне 16px (iOS не зумит)', () => {
  const seo = code(read('src/components/seo/SiteSeo.tsx'));
  assert.match(seo, /<meta name="viewport" content="width=device-width, initial-scale=1\.0" \/>/);
  assert.ok(!/user-scalable|maximum-scale/.test(seo));
  assert.match(read('src/styles/globals.css'), /@media \(max-width: 1024px\) \{[\s\S]*?input,\s*select,\s*textarea \{\s*font-size: 16px;/);
});

check('color-contrast: вторичный текст #737373 (4,74:1 на белом)', () => {
  const css = read('src/styles/globals.css');
  const light = css.slice(css.indexOf(':root {'), css.indexOf('[data-theme="dark"]'));
  assert.match(light, /--textTertiary: #737373;/);
});

check('aria-dialog-name: у всех окон есть имя', () => {
  assert.match(code(read('src/components/UI/modal/index.tsx')), /contentLabel=\{contentLabel \|\| title \|\| 'Диалоговое окно'\}/);
  assert.match(code(read('src/components/UI/galleryModal/index.tsx')), /contentLabel="Фотографии"/);
});

check('label: поля кода подписаны', () => {
  const s = code(read('src/components/UI/verificationCodeInput/index.tsx'));
  assert.match(s, /aria-label=\{`Цифра \$\{idx \+ 1\} из \$\{code\.length\}`\}/);
  assert.match(s, /autoComplete=\{idx === 0 \? 'one-time-code' : 'off'\}/);
});

check('aria-prohibited-attr / link-name: иконки магазинов role="img", логотип-ссылка с именем', () => {
  const f = code(read('src/components/footer/index.tsx'));
  assert.equal((f.match(/className=\{styles\.storeTile\} title="[^"]+" role="img" aria-label="[^"]+"/g) || []).length, 3);
  assert.match(code(read('src/components/header/index.tsx')), /<Link href="\/" aria-label="Totus Club — на главную">/);
});

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed ? 1 : 0);
