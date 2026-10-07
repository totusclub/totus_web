// Слайдеры главной на телефоне (< 480 px): дробный slidesToShow (1.2) только без infinite —
// иначе react-slick сдвигает ленту на 0,2 карточки и первая карточка обрезана слева.
// Запуск: node scripts/check-mobile-sliders.mjs
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

/** Все блоки responsive { breakpoint: N, settings: { ... } } → { N: 'текст settings' } */
function breakpoints(src) {
  const out = {};
  const re = /breakpoint:\s*(\d+),\s*settings:\s*\{([^}]*)\}/g;
  let m;
  while ((m = re.exec(src))) out[m[1]] = m[2];
  return out;
}

console.log('Слайдеры главной на телефоне');

for (const file of ['src/components/home/hotDeals.tsx', 'src/components/home/popularDestinations.tsx']) {
  const bp = breakpoints(code(read(file)));
  check(`${path.basename(file)}: < 480 px — 1.2 карточки, infinite: false, без точек и стрелок`, () => {
    assert.ok(bp['480'], 'нет breakpoint 480');
    assert.match(bp['480'], /slidesToShow:\s*1\.2,/);
    assert.match(bp['480'], /slidesToScroll:\s*1,/);
    assert.match(bp['480'], /infinite:\s*false,/);
    assert.match(bp['480'], /dots:\s*false,/);
    assert.match(bp['480'], /arrows:\s*false/);
  });
  check(`${path.basename(file)}: любой дробный slidesToShow — только с infinite: false`, () => {
    for (const [w, s] of Object.entries(bp)) {
      const n = (s.match(/slidesToShow:\s*([\d.]+)/) || [])[1];
      if (n && !Number.isInteger(Number(n))) assert.match(s, /infinite:\s*false/, `breakpoint ${w}: slidesToShow ${n}`);
    }
  });
}

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed ? 1 : 0);
