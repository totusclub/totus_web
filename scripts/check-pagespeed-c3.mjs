// PageSpeed C3–C4: шрифт только с нашего сервера (08.10: Google Fonts убраны по решению владельца), тема слайдеров без шрифта slick,
// картинки ниже первого экрана грузятся по мере приближения. Запуск: node scripts/check-pagespeed-c3.mjs
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (rel) => fs.readFileSync(path.join(root, rel), 'utf8');
const code = (s) => s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:])\/\/.*$/gm, '$1');
const walk = (dir) => fs.readdirSync(path.join(root, dir), { withFileTypes: true }).flatMap((e) =>
  e.isDirectory() ? walk(path.join(dir, e.name)) : [path.join(dir, e.name)]);

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

const globals = read('src/styles/globals.css');
const doc = code(read('src/pages/_document.tsx'));
const app = code(read('src/pages/_app.tsx'));
const theme = read('src/styles/slick-theme.css');

console.log('PageSpeed: шрифт, слайдеры, картинки ниже экрана');

check('шрифт: только с нашего сервера (файл из src/assets/fonts), без Google Fonts; запасные шрифты без засечек', () => {
  const faces = globals.match(/@font-face\s*\{[^}]*\}/g) || [];
  assert.equal(faces.length, 1);
  assert.match(faces[0], /font-family: "Golos Text";/);
  assert.match(faces[0], /src: url\("\.\/\.\.\/assets\/fonts\/GolosText-VariableFont_wght\.ttf"\) format\("truetype"\),\s*local\("Arial"\)/);
  assert.match(faces[0], /font-display: swap;/);
  for (const f of [globals, doc]) assert.ok(!/fonts\.gstatic\.com|fonts\.googleapis\.com/.test(f), 'нет Google Fonts');
  assert.match(globals, /body \{[\s\S]*?font-family: "Golos Text", [^;]*sans-serif;/);
});

check('тема слайдеров: своя, без шрифта slick и gif; подключена в _app; в компонентах не импортируется', () => {
  assert.match(app, /import '\.\.\/styles\/slick-theme\.css';/);
  assert.ok(!/@font-face|font-family|ajax-loader|url\(/.test(theme.replace(/\/\*[\s\S]*?\*\//g, '')));
  assert.match(theme, /\.slick-dots li button:before \{[\s\S]*content: '•';/);
  const users = walk('src').filter((f) => /\.(tsx?|jsx?)$/.test(f)).filter((f) => read(f).includes('slick-theme.css') && !f.endsWith('_app.tsx'));
  assert.deepEqual(users, []);
});

check('фото направлений: фон только когда блок рядом с экраном (desktop и mobile отдельно)', () => {
  const s = code(read('src/components/home/popularDestinations.tsx'));
  assert.match(s, /<div className=\{styles\.recomendDeslist\} ref=\{desktopListRef\}>/);
  assert.match(s, /<div className=\{styles\.recomendDeslistMob\} ref=\{mobileListRef\}>/);
  assert.match(s, /backgroundImage: desktopListVisible && destinationImage \? `url\(\$\{destinationImage\}\)` : undefined/);
  assert.match(s, /backgroundImage: mobileListVisible && item\?\.image \? `url\(\$\{item\.image\}\)` : undefined/);
});

check('фото отелей в «Начните планирование»: только когда блок рядом с экраном', () => {
  const s = code(read('src/components/home/hotDeals.tsx'));
  assert.match(s, /showImage=\{desktopListVisible\}/);
  assert.match(s, /showImage=\{mobileListVisible\}/);
  const card = code(read('src/components/hotelBox/hotelBoxCard.tsx'));
  assert.match(card, /showImage = true \}: ProductCardProps/);
  assert.match(card, /style=\{showImage && image \? \{backgroundImage: `url\(\$\{image\}\)`\} : undefined\}/);
});

check('блок «Оставьте номер»: layer.png и girl.png только когда блок рядом с экраном', () => {
  const css = read('src/components/home/home.module.css');
  const c = code(read('src/components/home/callRequest.tsx'));
  assert.equal((css.match(/url\("\/images\/layer\.png"\)/g) || []).length, 1);
  assert.match(css, /\.callRequestLeyerLoaded \{\s*(background-color: lightgray;\s*)?background-image: url\("\/images\/layer\.png"\);/);
  assert.match(css, /\.callRequestGirlLoaded \{\s*background-image: url\("\/images\/girl\.png"\);/);
  assert.match(c, /blockVisible \? styles\.callRequestLeyerLoaded : ''/);
  assert.match(c, /blockVisible \? styles\.callRequestGirlLoaded : ''/);
});

check('useNearViewport: IntersectionObserver, один раз true, без IO — сразу true', () => {
  const h = code(read('src/hooks/useNearViewport.ts'));
  assert.match(h, /new window\.IntersectionObserver\(/);
  assert.match(h, /setVisible\(true\);\s*observer\.disconnect\(\);/);
  assert.match(h, /typeof window\.IntersectionObserver === 'undefined'\) \{\s*setVisible\(true\);/);
});

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed ? 1 : 0);
