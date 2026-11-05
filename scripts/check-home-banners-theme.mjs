// Баннеры главной: своя картинка для светлой и для тёмной темы (из админки).
// Запуск: node scripts/check-home-banners-theme.mjs (без npm install).
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (rel) => readFileSync(path.join(root, rel), 'utf8');

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

const tsx = read('src/components/home/banners.tsx');
const api = read('src/api/homeBannersApi.ts');
const css = read('src/components/home/home.module.css');

console.log('Баннеры главной: светлая и тёмная тема');

check('API: у баннера image (светлая) и image_dark (тёмная, необязательно)', () => {
  assert.match(api, /image: string;/);
  assert.match(api, /image_dark\?: string;/);
  assert.match(api, /\/api\/home-banners/);
});

check('компонент: обе картинки — в CSS-переменные, классы только при загруженной картинке', () => {
  assert.match(tsx, /style\['--banner-light'\] = cssUrl\(light\);/);
  assert.match(tsx, /style\['--banner-dark'\] = cssUrl\(dark\);/);
  assert.match(tsx, /if \(light\) \{\s*classes\.push\(styles\.bannerLight\);/);
  assert.match(tsx, /if \(dark\) \{\s*classes\.push\(styles\.bannerDark\);/);
  assert.match(tsx, /style: light \|\| dark \? \(style as React\.CSSProperties\) : undefined/);
  assert.ok(!/backgroundImage/.test(tsx), 'инлайновый backgroundImage перебил бы тёмную тему');
});

check('компонент: начальные данные с сервера и ссылки — как раньше', () => {
  assert.match(tsx, /useState<HomeBanner\[\]>\(initialBanners \?\? \[\]\)/);
  assert.match(tsx, /if \(initialBanners\) return;\s*getHomeBanners\(\)/);
  assert.match(tsx, /target="_blank"\s*rel="noopener noreferrer"/);
  assert.match(tsx, /\{renderItem\(1\)\}\s*\{renderItem\(2\)\}/);
});

check('CSS: стандартные картинки на месте; своя светлая; тёмная только в [data-theme="dark"]', () => {
  const i1 = css.indexOf('.bannerItem:nth-child(1) {\n  background-image: url("./../../assets/images/bannerApp.png");');
  const i2 = css.indexOf('.bannerItem:nth-child(2) {\n  background-image: url("./../../assets/images/bannerVtb.png");');
  const iL = css.indexOf('.bannerItem.bannerLight {\n  background-image: var(--banner-light);\n}');
  const iD = css.indexOf(':global([data-theme="dark"]) .bannerItem.bannerDark {\n  background-image: var(--banner-dark);\n}');
  assert.ok(i1 > -1 && i2 > -1 && iL > -1 && iD > -1);
  assert.ok(iL > i2, 'своя светлая — после стандартных (та же специфичность, побеждает порядок)');
});

check('CSS: размеры, скругления и скрытие на телефоне не менялись', () => {
  assert.match(css, /\.bannerItem \{\s*display: flex;\s*flex: 1;\s*height: 240px;\s*border-radius: 24px;/);
  assert.match(css, /\.banners \{\s*\/\*display: inline;\*\/\s*display: none;/);
});

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed ? 1 : 0);
