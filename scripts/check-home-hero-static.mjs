// Hero главной статикой в сайте (11.10.2026): три картинки в public/hero, AVIF + WebP, без /api/home-hero.
// Статическая проверка исходников + наличие файлов. Запуск: node scripts/check-home-hero-static.mjs
// Файлов нет — соберите их: npm i --no-save sharp && node scripts/hero-assets.mjs (public/hero/README.md).
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

const config = code(read('src/config/homeHero.ts'));
const ssr = code(read('src/lib/homeSsr.ts'));
const page = code(read('src/pages/index.tsx'));
const search = code(read('src/components/search/index.tsx'));
const avifCss = read('src/components/search/heroAvif.module.css');
const nextConfig = code(read('next.config.ts'));

/** pickHomeHero и список картинок — как функции из исходника (без TypeScript). */
function loadConfig() {
  const js = config
    .replace(/^import type .*$/gm, '')
    .replace(/export type HomeHeroImage = \{[\s\S]*?\n\};/, '')
    .replace(/export /g, '')
    .replace(/: HomeHeroImage\[\]/g, '')
    .replace(/\(name: string\): HomeHeroImage =>/g, '(name) =>')
    .replace(/random: \(\) => number = Math\.random\): HomeHero/g, 'random = Math.random)');
  // eslint-disable-next-line no-new-func
  return new Function(`${js}\nreturn { HOME_HERO_TITLE, HOME_HERO_IMAGES, pickHomeHero };`)();
}

console.log('Главная: hero статикой в сайте (AVIF + WebP)');

const cfg = loadConfig();

check('три картинки, у каждой 4 файла в /hero (компьютер и телефон, AVIF и WebP)', () => {
  assert.equal(cfg.HOME_HERO_IMAGES.length, 3);
  assert.deepEqual(cfg.HOME_HERO_IMAGES[1], {
    image: '/hero/hero-2.webp',
    imageAvif: '/hero/hero-2.avif',
    imageMobile: '/hero/hero-2-m.webp',
    imageMobileAvif: '/hero/hero-2-m.avif',
  });
  assert.equal(cfg.HOME_HERO_TITLE, 'Путешествия начинаются здесь');
});

check('файлы картинок лежат в public/hero (AVIF и WebP, непустые)', () => {
  const missing = [];
  for (const hero of cfg.HOME_HERO_IMAGES) {
    for (const url of Object.values(hero)) {
      const file = path.join(root, 'public', url);
      if (!fs.existsSync(file) || fs.statSync(file).size < 1024) missing.push(url);
      else {
        const head = fs.readFileSync(file).subarray(0, 12).toString('latin1');
        if (url.endsWith('.webp')) assert.ok(head.startsWith('RIFF') && head.slice(8) === 'WEBP', `${url}: не WebP`);
        if (url.endsWith('.avif')) assert.ok(head.slice(4, 12) === 'ftypavif' || head.slice(4, 8) === 'ftyp', `${url}: не AVIF`);
      }
    }
  }
  assert.deepEqual(missing, [], 'нет файлов — npm i --no-save sharp && node scripts/hero-assets.mjs');
});

check('случайный выбор на каждый заход: все три, без выхода за список', () => {
  const seen = new Set();
  for (const r of [0, 0.2, 0.34, 0.5, 0.67, 0.9, 0.9999999, 1]) {
    const hero = cfg.pickHomeHero(() => r);
    assert.equal(hero.title, cfg.HOME_HERO_TITLE);
    assert.ok(hero.image && hero.imageMobile && hero.imageAvif && hero.imageMobileAvif);
    seen.add(hero.image);
  }
  assert.equal(seen.size, 3);
});

check('сервер главной не ходит в /api/home-hero', () => {
  assert.ok(!/fetchJson\('\/api\/home-hero'\)/.test(ssr));
  assert.match(ssr, /import \{ pickHomeHero \} from '@\/config\/homeHero';/);
  assert.match(ssr, /homeHero: plain\(pickHomeHero\(\)\),/);
});

check('preload: AVIF с type="image/avif" по media (телефон / компьютер), fetchPriority=high', () => {
  assert.match(page, /<link rel="preload" as="image" type="image\/avif" href=\{homeHero\.imageMobileAvif\} media=\{HERO_MOBILE_MEDIA\} fetchPriority="high" key="home-hero-image-mobile" \/>/);
  assert.match(page, /<link rel="preload" as="image" type="image\/avif" href=\{homeHero\.imageAvif\} media=\{HERO_DESKTOP_MEDIA\} fetchPriority="high" key="home-hero-image" \/>/);
  assert.match(page, /homeHero\.imageMobile && !\(homeHero\.imageAvif && homeHero\.imageMobileAvif\) \?/, 'WebP-preload — только без AVIF (не качать обе)');
});

check('фон: WebP как раньше + AVIF через image-set для браузеров, которые его понимают', () => {
  assert.match(search, /import heroAvifStyles from '\.\/heroAvif\.module\.css';/);
  assert.match(search, /\['--hero-mobile-avif' as string\]: `image-set\(url\(\$\{hero\.imageMobileAvif\}\) type\("image\/avif"\), url\(\$\{hero\.imageMobile\}\) type\("image\/webp"\)\)`/);
  assert.match(search, /\$\{hasAvif \? ` \$\{heroAvifStyles\.heroAvif\}` : ''\}/);
  assert.match(avifCss, /@supports \(background-image: image-set\("a\.avif" type\("image\/avif"\)\)\) \{/);
  assert.match(avifCss, /\.heroAvif\.heroAvif \{\s*background-image: var\(--hero-desktop-avif\);\s*\}/);
  assert.match(avifCss, /@media \(max-width: 600px\) \{\s*\.heroAvif\.heroAvif \{\s*background-image: var\(--hero-mobile-avif\);\s*\}\s*\}/);
  assert.ok(!/url\(/.test(avifCss.replace(/\/\*[\s\S]*?\*\//g, '')), 'без url() в CSS-модуле (сборщик не ищет файлы)');
});

check('кеш /hero/* — год, immutable (next.config.ts)', () => {
  assert.match(nextConfig, /source: '\/hero\/:file\*',\s*headers: \[\{ key: 'Cache-Control', value: 'public, max-age=31536000, immutable' \}\],/);
});

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed ? 1 : 0);
