// Карта лояльности в профиле по утверждённому макету 15.10.2026: светлая тема — вариант C «Светлая»,
// тёмная ([data-theme="dark"]) — вариант B «Графит». Запуск: node scripts/check-loyalty-card.mjs (без npm install).
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (rel) => fs.readFileSync(path.join(root, rel), 'utf8');
const stripCss = (s) => s.replace(/\/\*[\s\S]*?\*\//g, '');

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

const card = read('src/components/profile/LoyaltyCard.tsx');
const css = stripCss(read('src/components/profile/loyaltyCard.module.css'));
const menu = read('src/components/profile/menu.tsx');
const profileCss = stripCss(read('src/components/profile/profile.module.css'));

console.log('Карта лояльности в профиле');

check('меню профиля показывает новую карту, имя без «undefined», старый оранжевый фон убран', () => {
  assert.match(menu, /import LoyaltyCard, \{ loyaltyHolderName \} from "\.\/LoyaltyCard";/);
  assert.match(menu, /<LoyaltyCard number=\{user\?\.loyalty_id\} name=\{loyaltyHolderName\(user\?\.name, user\?\.l_name\)\} \/>/);
  assert.ok(!/\$\{user\?\.name\} \$\{user\?\.l_name\}/.test(menu));
  assert.ok(!/profileCard|cardLaer|profileName|userCardIcon|smallInfoCard/.test(menu + profileCss));
});

const block = (sel) => {
  const i = css.indexOf(sel);
  assert.ok(i >= 0, sel);
  return css.slice(i, css.indexOf('}', i));
};

check('цвета как в макете: C в светлой теме, B в тёмной', () => {
  const light = block('.card {');
  const dark = block(':global([data-theme="dark"]) .card {');
  for (const [k, v] of [['bg', '#F7F3EE'], ['border', '#E6DFD6'], ['ink', '#1F1F1F'], ['sub', '#5E5B56'], ['brand', '#C24A0E'], ['bird', '#FE732E']]) {
    assert.match(light, new RegExp(`--lc-${k}: ${v};`), `light ${k}`);
  }
  for (const [k, v] of [['bg', '#1C1B1A'], ['border', '#2C2C2C'], ['ink', '#FFFFFF'], ['sub', '#BDB6AE'], ['brand', '#FE732E'], ['bird', '#FE732E']]) {
    assert.match(dark, new RegExp(`--lc-${k}: ${v};`), `dark ${k}`);
  }
});

check('пропорции банковской карты, Forum у заголовка, кнопка копирования 44 px', () => {
  assert.match(block('.card {'), /aspect-ratio: 1\.586;/);
  assert.match(block('.title {'), /font-family: var\(--font-heading\);/);
  assert.match(block('.number {'), /font-variant-numeric: tabular-nums;/);
  assert.match(block('.copy {'), /width: 44px;\s*height: 44px;/);
  assert.match(card, /aria-label=\{copied \? 'Номер скопирован' : 'Скопировать номер карты'\}/);
  assert.match(card, /navigator\.clipboard\?\.writeText/);
  assert.match(card, /document\.execCommand\('copy'\)/);
  for (const t of ['>Карта лояльности<', '>Totus Club<', "'Ваш персональный номер'"]) assert.ok(card.includes(t), t);
});

const fnSrc = (name) => {
  const m = card.match(new RegExp(`export function ${name}\\(([^)]*)\\): string \\{([\\s\\S]*?)\\n\\}`));
  assert.ok(m, name);
  const args = m[1].split(/,(?![^<]*>)/).map((a) => a.split(':')[0].replace('?', '').trim());
  // eslint-disable-next-line no-new-func
  return new Function(...args, m[2]);
};

check('номер группами по 4, инициалы, имя без пустых частей', () => {
  const fmt = fnSrc('formatLoyaltyNumber');
  assert.equal(fmt('5281047399162045'), '5281 0473 9916 2045');
  assert.equal(fmt(12345), '1234 5');
  assert.equal(fmt(undefined), '0000 0000 0000 0000');
  const ini = fnSrc('loyaltyInitials');
  assert.equal(ini('Анна Смирнова'), 'АС');
  assert.equal(ini(''), '');
  const holder = fnSrc('loyaltyHolderName');
  assert.equal(holder('Анна', 'Смирнова'), 'Анна Смирнова');
  assert.equal(holder('Анна', undefined), 'Анна');
  assert.equal(holder(undefined, null), '');
});

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed ? 1 : 0);
