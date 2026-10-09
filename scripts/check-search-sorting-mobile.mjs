// Страница поиска, телефон/планшет: «Сортировка» и «Показано N из M отелей» не накладываются.
// Раньше счётчик был position: absolute; right: 0 поверх селекта шириной 100 %.
// Запуск: node scripts/check-search-sorting-mobile.mjs
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (rel) => fs.readFileSync(path.join(root, rel), 'utf8');
const noComments = (s) => s.replace(/\/\*[\s\S]*?\*\//g, '');

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

function rules(css) {
  const out = [];
  const walk = (text, media) => {
    let i = 0;
    while (i < text.length) {
      const open = text.indexOf('{', i);
      if (open < 0) break;
      const head = text.slice(i, open).trim();
      let depth = 1;
      let j = open + 1;
      while (j < text.length && depth) {
        if (text[j] === '{') depth++;
        else if (text[j] === '}') depth--;
        j++;
      }
      const body = text.slice(open + 1, j - 1);
      if (head.startsWith('@media')) walk(body, head);
      else if (!head.startsWith('@keyframes')) out.push({ media, selector: head.replace(/\s+/g, ' '), body });
      i = j;
    }
  };
  walk(noComments(css), '');
  return out;
}
// Последнее значение свойства для селектора в данном @media (каскад внутри файла).
function decl(list, media, selector, prop) {
  let value;
  for (const r of list.filter((x) => x.media === media && x.selector.split(',').map((s) => s.trim()).includes(selector))) {
    for (const m of r.body.matchAll(new RegExp(`(?:^|;|\\s)${prop}\\s*:\\s*([^;]+);`, 'g'))) value = m[1].trim();
  }
  return value;
}

const css = rules(read('src/components/searchPage/searchPage.module.css'));
const TAB = '@media (max-width: 1024px)';
const MOB = '@media (max-width: 768px)';
const list = read('src/components/searchPage/searchResult/resultList.tsx');

console.log('Поиск, телефон: сортировка и счётчик не накладываются');

check('разметка: в строке сначала счётчик <p>, затем Select (на него опираются селекторы p + :last-child)', () => {
  assert.match(list, /<div className=\{styles\.resultListSorting\}>\s*<p>[\s\S]*?<\/p>\s*<Select/);
});

check('≤1024: счётчик в потоке (не absolute), справа, переносится по словам', () => {
  const pos = decl(css, TAB, '.resultListSorting > p', 'position');
  assert.notEqual(pos, 'absolute', 'счётчик снова поверх селекта');
  assert.equal(pos, 'static');
  assert.equal(decl(css, TAB, '.resultListSorting > p', 'order'), '2');
  assert.equal(decl(css, TAB, '.resultListSorting > p', 'min-width'), '0');
  assert.equal(decl(css, TAB, '.resultListSorting > p', 'flex'), '0 1 auto');
  assert.equal(decl(css, TAB, '.resultListSorting > p', 'text-align'), 'right');
});

check('≤1024: строка — ряд без переноса, селект слева занимает остаток и не сжимается', () => {
  assert.equal(decl(css, TAB, '.resultListSorting', 'flex-direction'), 'row');
  assert.equal(decl(css, TAB, '.resultListSorting', 'flex-wrap'), 'nowrap');
  assert.equal(decl(css, TAB, '.resultListSorting > p + :last-child', 'order'), '1');
  assert.equal(decl(css, TAB, '.resultListSorting > p + :last-child', 'flex'), '1 0 auto !important', 'перекрывает inline flex: none у Select');
  assert.equal(decl(css, TAB, '.resultListSorting > p + :last-child', 'width'), 'auto');
});

check('≤768: у селекта без рамки нет боковых полей', () => {
  const sel = ".resultListSorting > p + :last-child [role='combobox']";
  assert.equal(decl(css, MOB, sel, 'padding-left'), '0');
  assert.equal(decl(css, MOB, sel, 'padding-right'), '0');
});

check('компьютер не тронут: счётчик слева, селект 320 px', () => {
  assert.equal(decl(css, '', '.resultListSorting', 'justify-content'), 'space-between');
  assert.equal(decl(css, '', '.resultListSorting > :last-child', 'width'), '320px');
  assert.equal(decl(css, '', '.resultListSorting > p', 'position'), undefined);
});

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed ? 1 : 0);
