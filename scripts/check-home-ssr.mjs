// PageSpeed C1–C2: первый экран главной из HTML (hero, баннеры, партнёры, блоки главной).
// Статическая проверка исходников. Запуск: node scripts/check-home-ssr.mjs (без npm install).
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

const ssr = code(read('src/lib/homeSsr.ts'));
const page = code(read('src/pages/index.tsx'));
const search = code(read('src/components/search/index.tsx'));
const banners = code(read('src/components/home/banners.tsx'));
const partner = code(read('src/components/home/partner.tsx'));
const hook = code(read('src/hooks/loadHomeData.ts'));
const header = code(read('src/components/header/index.tsx'));
const app = code(read('src/pages/_app.tsx'));
const doc = code(read('src/pages/_document.tsx'));

console.log('Главная: данные первого экрана в HTML');

check('сервер: 3 запроса параллельно (hero — статикой, без API), таймаут, ошибка → null (без падения страницы)', () => {
  assert.match(ssr, /export const HOME_SSR_TIMEOUT_MS = 1200;/);
  assert.match(ssr, /await Promise\.all\(\[\s*fetchJson\('\/home\/data'\),\s*fetchJson\('\/api\/home-banners'\),\s*fetchJson\('\/api\/home-partners'\),\s*\]\)/);
  assert.match(ssr, /homeHero: plain\(pickHomeHero\(\)\),/);
  assert.match(ssr, /setTimeout\(\(\) => controller\.abort\(\), timeoutMs\)/);
  assert.match(ssr, /if \(!response\.ok\) return null;/);
  assert.match(ssr, /\} catch \{\s*return null;\s*\}/);
  assert.match(ssr, /JSON\.parse\(JSON\.stringify\(value\)\)/, 'пропсы без undefined');
  assert.match(ssr, /process\.env\.API_INTERNAL_URL \|\| API_BASE_URL/);
});

check('страница: getServerSideProps отдаёт данные; hero предзагружается с fetchPriority=high', () => {
  assert.match(page, /const homeSsr = await loadHomeSsrData\(\);\s*return \{\s*props: homeSsr,/);
  assert.match(page, /<link rel="preload" as="image" href=\{homeHero\.image\} fetchPriority="high"/);
  // мобильная версия hero (08.10): отдельные preload по media — scripts/check-home-hero-mobile.mjs
  assert.match(page, /href=\{homeHero\.imageMobile\} media=\{HERO_MOBILE_MEDIA\} fetchPriority="high"/);
  assert.match(page, /<Search initialHero=\{homeHero\} \/>/);
  assert.match(page, /<HomeBanners initialBanners=\{homeBanners\} \/>/);
  assert.match(page, /<Partner initialPartners=\{homePartners\} \/>/);
  assert.match(page, /useLoadHomeData\(initialHomeData\)/);
});

check('hero: заголовок и картинка из HTML; без данных сервера — запрос в браузере, как раньше', () => {
  assert.match(search, /useState<string \| null>\(initialHero \? initialHero\.title \|\| DEFAULT_TITLE : null\)/);
  assert.match(search, /useState\(initialHero\?\.image \|\| ''\)/);
  assert.match(search, /if \(initialHero\) \{\s*publishHomeHeroTitle\(initialHero\.title \|\| DEFAULT_TITLE\);\s*return;\s*\}\s*let cancelled = false;\s*getHomeHero\(\)/);
  assert.match(search, /style=\{\{ \.\.\.heroBackground\(heroImage, heroImageMobile\), \.\.\.avifStyle \}\}/);
  assert.match(search, /if \(!imageMobile\) return \{ backgroundImage: `url\(\$\{image\}\)` \};/);
});

check('шапка (desktop): заголовок hero с сервера, без мигания', () => {
  assert.match(header, /const heroTitle = useHomeHeroTitle\(\) \?\? ssrHeroTitle;/);
  assert.match(app, /<Header heroTitle=\{pageProps\?\.homeHero\?\.title \?\? null\} \/>/);
});

check('баннеры, партнёры, блоки главной: начальное состояние с сервера, повторного запроса нет', () => {
  assert.match(banners, /useState<HomeBanner\[\]>\(initialBanners \?\? \[\]\)/);
  assert.match(banners, /if \(initialBanners\) return;\s*getHomeBanners\(\)/);
  assert.match(partner, /useState<HomePartner\[\]>\(initialPartners \?\? \[\]\)/);
  assert.match(partner, /useState\(initialPartners === null\)/);
  assert.match(partner, /if \(initialPartners\) return;\s*getHomePartners\(\)/);
  assert.match(hook, /useState<HomeDataPayload \| null>\(initial\)/);
  assert.match(hook, /if \(initial\) return;/);
});

check('логотипы партнёров: размеры заданы (без сдвига), по-прежнему lazy', () => {
  assert.match(partner, /loading="lazy"\s*decoding="async"\s*width=\{160\}\s*height=\{64\}/);
});

check('_document: preconnect к API и CDN фото отелей', () => {
  assert.match(doc, /<link rel="preconnect" href="https:\/\/api\.totus\.club" \/>/);
  assert.match(doc, /<link rel="preconnect" href="https:\/\/api\.totus\.club" crossOrigin="" \/>/);
  assert.match(doc, /<link rel="preconnect" href="https:\/\/img\.cdn\.level\.travel" \/>/);
});

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed ? 1 : 0);
