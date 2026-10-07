// PageSpeed C3–C4: шрифт без блокирующего CSS Google Fonts, тема слайдеров без шрифта slick,
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

check('шрифт: @font-face "Golos Text" с fonts.gstatic.com (кириллица, латиница + ext), без TTF и без CSS googleapis', () => {
  const faces = globals.match(/@font-face\s*\{[^}]*\}/g) || [];
  assert.equal(faces.length, 4);
  for (const f of faces) {
    assert.match(f, /font-family: "Golos Text";/);
    assert.match(f, /font-weight: 400 800;/);
    assert.match(f, /font-display: swap;/);
    assert.match(f, /src: url\(https:\/\/fonts\.gstatic\.com\/s\/golostext\/v7\/[A-Za-z0-9]+\.woff2\) format\("woff2"\);/);
    assert.match(f, /unicode-range: /);
  }
  assert.ok(!/GolosText-VariableFont_wght\.ttf/.test(globals));
  assert.ok(!/fonts\.googleapis\.com/.test(doc), 'нет блокирующего CSS Google Fonts');
  for (const file of ['q5uCsoe9Lv5t7Meb31EcExd8hLxR', 'q5uCsoe9Lv5t7Meb31EcExN8hA']) {
    assert.ok(globals.includes(file), file);
    assert.match(doc, new RegExp(`rel="preload"\\s*as="font"\\s*type="font/woff2"\\s*href="https://fonts\\.gstatic\\.com/s/golostext/v7/${file}\\.woff2"\\s*crossOrigin=""`));
  }
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
