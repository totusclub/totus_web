// PageSpeed mobile: критический CSS в HTML (optimizeCss + beasties), включается только при установленном пакете.
// Запуск: node scripts/check-css-inline.mjs (без npm install).
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (rel) => fs.readFileSync(path.join(root, rel), 'utf8');

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

console.log('Критический CSS в HTML');

check('next.config: optimizeCss только если пакет beasties установлен', () => {
  const cfg = read('next.config.ts');
  assert.match(cfg, /optimizeCss: hasPackage\('beasties'\),/);
  assert.match(cfg, /typeof require === 'function' && Boolean\(require\.resolve\(name\)\)/);
  assert.match(cfg, /\} catch \{\s*return false;\s*\}/);
});

check('блок «Оставьте номер»: серая подложка только вместе с картинкой', () => {
  const css = read('src/components/home/home.module.css');
  const base = css.slice(css.indexOf('.callRequestLeyer {'), css.indexOf('.callRequestLeyerLoaded {'));
  assert.ok(!/lightgray/.test(base));
  assert.match(css, /\.callRequestLeyerLoaded \{\s*background-color: lightgray;\s*background-image: url\("\/images\/layer\.png"\);/);
});

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed ? 1 : 0);
