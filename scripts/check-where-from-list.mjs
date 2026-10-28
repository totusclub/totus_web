// Поле «Откуда?»: после выбора города и при каждом открытии список показывает все города,
// а не только выбранный (раньше фильтр брал текст поля — название выбранного города).
// Запуск: node scripts/check-where-from-list.mjs (без npm install).
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const src = fs.readFileSync(path.join(root, 'src/components/search/whereFrom.tsx'), 'utf8');

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

console.log('Поле «Откуда?»');

check('список фильтруется по query, а не по тексту поля', () => {
  assert.match(src, /const \[query, setQuery\] = useState\(""\);/);
  assert.match(src, /useDepartureSearch\(query\)/);
  assert.ok(!/useDepartureSearch\(searchValue\)/.test(src));
});

check('ввод меняет и текст поля, и фильтр (оба поля ввода)', () => {
  assert.match(src, /setSearchValue\(text\);\s*setQuery\(text\);/);
  assert.equal((src.match(/onChange=\{\(e\) => handleInput\(e\.target\.value\)\}/g) || []).length, 2);
  assert.ok(!/onChange=\{\(e\) => setSearchValue\(/.test(src));
});

check('после выбора в поле — название города, фильтр сброшен', () => {
  assert.match(src, /setSearchValue\(item\?\.name\);\s*setQuery\(""\);/);
});

check('при открытии фильтр сброшен — весь список, название выделено', () => {
  assert.match(src, /if \(!isOpen\) return;[\s\S]*?setQuery\(""\);[\s\S]*?inputRef\.current\.select\(\);[\s\S]*?\}, \[isOpen\]\);/);
});

check('«Список городов пуст» / «Ничего не найдено» — по фильтру', () => {
  assert.match(src, /\) : query\.trim\(\) === "" \? \(/);
});

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed ? 1 : 0);
