// PageSpeed mobile: критический CSS в HTML (optimizeCss + critters), включается только при установленном пакете.
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

check('next.config: optimizeCss только если пакет critters установлен (его требует Next 15.3)', () => {
  const cfg = read('next.config.ts');
  assert.match(cfg, /optimizeCss: hasPackage\('critters'\),/);
  assert.match(cfg, /typeof require === 'function' && Boolean\(require\.resolve\(name\)\)/);
  assert.match(cfg, /\} catch \{\s*return false;\s*\}/);
});

check('блок «Оставьте номер»: слой — градиент CSS, без картинки и серой подложки', () => {
  const css = read('src/components/home/home.module.css');
  const base = css.slice(css.indexOf('.callRequestLeyer {'), css.indexOf('.callRequestGirl {'));
  assert.ok(!/lightgray/.test(base));
  assert.ok(!/url\(/.test(base));
  assert.ok(!/layer\.png/.test(css.replace(/\/\*[\s\S]*?\*\//g, '')));
  assert.ok(!/\.callRequestLeyerLoaded/.test(css));
});

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed ? 1 : 0);
