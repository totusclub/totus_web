// Карусели главной на телефоне и планшете (до 1024 px): обычная горизонтальная прокрутка браузера
// с привязкой к карточке (scroll-snap) вместо react-slick — плавно, с инерцией, без рывков и остановок
// на полкарточки. Макет «Главная на телефоне» утверждён 09.10.2026. Компьютер не меняется.
// Запуск: node scripts/check-mobile-sliders.mjs
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (rel) => fs.readFileSync(path.join(root, rel), 'utf8');
const code = (s) => s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\{\s*\}/g, '').replace(/(^|[^:])\/\/.*$/gm, '$1');

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

/** Тело блока @media (...) — по балансу скобок. */
function media(src, query) {
  const i = src.indexOf(`@media ${query}`);
  if (i < 0) return '';
  let depth = 0;
  for (let j = src.indexOf('{', i); j < src.length; j++) {
    if (src[j] === '{') depth++;
    else if (src[j] === '}' && --depth === 0) return src.slice(src.indexOf('{', i) + 1, j);
  }
  return '';
}

const css = read('src/components/home/home.module.css').replace(/\/\*[\s\S]*?\*\//g, '');
const mob = media(css, '(max-width: 1024px)');
const rule = (src, sel) => (src.match(new RegExp(`(?:^|\\n)\\s*${sel.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')} \\{([^}]*)\\}`)) || [])[1] || '';

console.log('Карусели главной на телефоне');

for (const [file, wrap, extra] of [
  ['src/components/home/hotDeals.tsx', 'recomendlistMob', ''],
  ['src/components/home/popularDestinations.tsx', 'recomendDeslistMob', ''],
  ['src/components/home/partner.tsx', 'partnerListMob', 'mobScrollerPartners'],
]) {
  const s = code(read(file));
  check(`${path.basename(file)}: без react-slick, лента .mobScroller, каждая карточка — .mobScrollerItem`, () => {
    assert.ok(!/react-slick|slick-carousel|<Slider/.test(s), 'react-slick не используется');
    assert.match(s, new RegExp(`<div className=\\{styles\\.${wrap}\\}`));
    const cls = extra ? `\\{\`\\$\\{styles\\.mobScroller\\} \\$\\{styles\\.${extra}\\}\`\\}` : '\\{styles\\.mobScroller\\}';
    assert.match(s, new RegExp(`<div className=${cls}>`));
    assert.match(s, /className=\{styles\.mobScrollerItem\}/);
  });
}

check('лента: прокрутка вбок с привязкой к карточке, поля 16px, промежуток 12px, без полосы прокрутки', () => {
  const r = rule(mob, '.mobScroller');
  assert.match(r, /display: flex;/);
  assert.match(r, /gap: 12px;/);
  assert.match(r, /overflow-x: auto;/);
  assert.match(r, /padding: 0 16px 4px;/);
  assert.match(r, /scroll-snap-type: x mandatory;/);
  assert.match(r, /scroll-padding-inline: 16px;/);
  assert.match(r, /scrollbar-width: none;/);
  assert.match(mob, /\.mobScroller::-webkit-scrollbar \{\s*display: none;\s*\}/);
});

check('карточка: ширина экрана без 48px (следующая выглядывает), не шире 340px; логотипы — 120px', () => {
  const r = rule(mob, '.mobScrollerItem');
  assert.match(r, /flex: 0 0 min\(calc\(100% - 48px\), 340px\);/);
  assert.match(r, /scroll-snap-align: start;/);
  assert.match(rule(mob, '.mobScrollerPartners .mobScrollerItem'), /flex-basis: 120px;/);
});

check('стили ленты только для телефона и планшета (вне @media их нет)', () => {
  const outside = css.replace(mob, '');
  assert.ok(!/\.mobScroller/.test(outside));
});

check('старые правила slick в модуле убраны (в CSS-модуле они не срабатывали)', () => {
  assert.ok(!/\.slick-(slider|slide|dots|list)/.test(css));
});

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed ? 1 : 0);
