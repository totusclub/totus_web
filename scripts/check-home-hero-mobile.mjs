// PageSpeed mobile (08.10): мобильная версия картинки hero и фото отелей после загрузки страницы.
// Статическая проверка исходников + разбор ответа API. Запуск: node scripts/check-home-hero-mobile.mjs
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

const api = code(read('src/api/homeHeroApi.ts'));
const ssr = code(read('src/lib/homeSsr.ts'));
const page = code(read('src/pages/index.tsx'));
const search = code(read('src/components/search/index.tsx'));
const css = read('src/components/search/search.module.css');
const deals = code(read('src/components/home/hotDeals.tsx'));
const hook = code(read('src/hooks/useAfterPageLoad.ts'));

console.log('Главная на телефоне: лёгкая картинка hero, фото отелей после загрузки');

check('API: image_mobile → imageMobile (SSR и браузер); нет поля — пусто', () => {
  assert.match(api, /imageMobile\?: string;/);
  assert.match(api, /imageMobile: data\?\.data\?\.image_mobile \|\| '',/);
  assert.match(ssr, /imageMobile: body\?\.data\?\.image_mobile \|\| '',/);
  // toHomeHero как функция: разбор ответа старого и нового API
  const fnSrc = ssr.match(/export function toHomeHero\(body: any\): HomeHero \| null \{([\s\S]*?)\n\}/)[1];
  // eslint-disable-next-line no-new-func
  const toHomeHero = new Function('body', 'DEFAULT_HERO_TITLE', fnSrc);
  assert.deepEqual(toHomeHero({ data: { title: 'T', image: 'https://a/x.webp', image_mobile: 'https://a/x.webp.m.webp' } }, 'D'),
    { title: 'T', image: 'https://a/x.webp', imageMobile: 'https://a/x.webp.m.webp' });
  assert.deepEqual(toHomeHero({ data: { title: 'T', image: 'https://a/x.webp' } }, 'D'), { title: 'T', image: 'https://a/x.webp', imageMobile: '' }, 'старый API');
  assert.equal(toHomeHero(null, 'D'), null);
});

check('граница 600 px одна для CSS и preload', () => {
  assert.match(api, /export const HERO_MOBILE_MAX_WIDTH = 600;/);
  assert.match(api, /export const HERO_MOBILE_MEDIA = `\(max-width: \$\{HERO_MOBILE_MAX_WIDTH\}px\)`;/);
  assert.match(api, /export const HERO_DESKTOP_MEDIA = `\(min-width: \$\{HERO_MOBILE_MAX_WIDTH \+ 1\}px\)`;/);
  assert.match(css, /\.searchHeroMobile \{\s*background-image: var\(--hero-desktop\);\s*\}\s*@media \(max-width: 600px\) \{\s*\.searchHeroMobile \{\s*background-image: var\(--hero-mobile\);\s*\}\s*\}/);
  assert.ok(!/!important/.test(css.slice(css.indexOf('.searchHeroMobile'))), 'без !important');
});

check('preload: есть мобильная — две ссылки по media (телефон качает только свою); нет — одна, как раньше', () => {
  assert.match(page, /\{homeHero\?\.image && !homeHero\.imageMobile \? \(\s*<Head>[\s\S]{0,120}?<link rel="preload" as="image" href=\{homeHero\.image\} fetchPriority="high" key="home-hero-image" \/>/);
  // без AVIF (картинки с API) — WebP по media; со статическими hero (AVIF) — scripts/check-home-hero-static.mjs
  assert.match(page, /\{homeHero\?\.image && homeHero\.imageMobile && !\(homeHero\.imageAvif && homeHero\.imageMobileAvif\) \? \(\s*<Head>[\s\S]{0,120}?<link rel="preload" as="image" href=\{homeHero\.imageMobile\} media=\{HERO_MOBILE_MEDIA\} fetchPriority="high" key="home-hero-image-mobile" \/>\s*<link rel="preload" as="image" href=\{homeHero\.image\} media=\{HERO_DESKTOP_MEDIA\} fetchPriority="high" key="home-hero-image" \/>/);
  assert.match(page, /import \{ HERO_DESKTOP_MEDIA, HERO_MOBILE_MEDIA \} from "@\/api\/homeHeroApi";/);
});

check('фон hero: нет мобильной — как раньше; есть — обе в CSS-переменных (в style нет background-image) + класс', () => {
  assert.match(search, /if \(!image\) return undefined;/);
  assert.match(search, /if \(!imageMobile\) return \{ backgroundImage: `url\(\$\{image\}\)` \};/);
  assert.match(search, /return \{\s*\['--hero-desktop' as string\]: `url\(\$\{image\}\)`,\s*\['--hero-mobile' as string\]: `url\(\$\{imageMobile\}\)`,\s*\} as CSSProperties;/);
  assert.match(search, /useState\(initialHero\?\.image \? initialHero\.imageMobile \|\| '' : ''\)/);
  assert.match(search, /\$\{heroImage && heroImageMobile \? ` \$\{styles\.searchHeroMobile\}` : ''\}/);
  assert.match(search, /style=\{\{ \.\.\.heroBackground\(heroImage, heroImageMobile\), \.\.\.avifStyle \}\}/);
});

check('без SSR (запрос в браузере): заранее грузится версия для этого экрана', () => {
  assert.match(search, /const useMobile = Boolean\(mobile\) && window\.matchMedia\?\.\(HERO_MOBILE_MEDIA\)\.matches;/);
  assert.match(search, /img\.src = useMobile \? mobile : hero\.image;/);
  assert.match(search, /setHeroImageMobile\(mobile\);\s*setHeroImage\(hero\.image\);/);
});

check('фото отелей «Начните планирование»: рядом с экраном И после загрузки страницы', () => {
  assert.match(deals, /import \{ useAfterPageLoad \} from "@\/hooks\/useAfterPageLoad";/);
  assert.match(deals, /const pageLoaded = useAfterPageLoad\(\);/);
  assert.match(deals, /showImage=\{desktopListVisible && pageLoaded\}/);
  assert.match(deals, /showImage=\{mobileListVisible && pageLoaded\}/);
});

check('useAfterPageLoad: load → простой браузера; уже загружено — сразу; страховка по времени; уборка', () => {
  assert.match(hook, /if \(document\.readyState === 'complete'\) afterLoad\(\);\s*else window\.addEventListener\('load', afterLoad, \{ once: true \}\);/);
  assert.match(hook, /idleId = window\.requestIdleCallback\(done, \{ timeout: idleTimeoutMs \}\);/);
  assert.match(hook, /idleTimer = window\.setTimeout\(done, 200\);/);
  assert.match(hook, /const maxTimer = window\.setTimeout\(done, maxWaitMs\);/);
  assert.match(hook, /window\.removeEventListener\('load', afterLoad\);/);
  assert.match(hook, /window\.clearTimeout\(maxTimer\);/);
  assert.match(hook, /if \(typeof window === 'undefined'\) return undefined;/);
});

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed ? 1 : 0);
