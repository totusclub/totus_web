// Фото отеля: прямоугольные кадры 5:3, верх кадра — нижняя полоса с надписью Level.Travel не видна.
// Фото Level.Travel 3:2 (750×500): в рамке 5:3 с object-fit: cover и привязкой к верху срезаются
// только нижние 10 % кадра, бока не режутся. Запуск: node scripts/check-hotel-photos.mjs
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

// Правила CSS: [{ media, selector, body }] — простой разбор, вложенность только @media.
function rules(css) {
  const out = [];
  const src = noComments(css);
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
      else if (!head.startsWith('@keyframes')) out.push({ media, selector: head, body });
      i = j;
    }
  };
  walk(src, '');
  return out;
}
function decl(list, media, selector, prop) {
  const hits = list.filter((r) => r.media === media && r.selector.split(',').map((x) => x.trim()).includes(selector));
  let value;
  for (const r of hits) {
    for (const m of r.body.matchAll(new RegExp(`(?:^|;|\\s)${prop}\\s*:\\s*([^;]+);`, 'g'))) value = m[1].trim();
  }
  return value;
}

const slideCss = rules(read('src/components/UI/verticalSlide/verticalSlide.module.css'));
const modalCss = rules(read('src/components/UI/galleryModal/galleryModal.module.css'));
const DESK = '';
const SLIDE_M = '@media (max-width: 1024px)';
const MODAL_M = '@media (max-width: 768px)';
const ratio = (w, h) => Math.abs(parseFloat(w) / parseFloat(h) - 5 / 3) < 0.03;

console.log('Фото отеля: 5:3, без надписи Level.Travel');

check('математика: кадр 3:2 в рамке 5:3 — срезано ровно 10 % снизу, бока целы (надпись LT ~8 % снизу)', () => {
  const imgW = 750, imgH = 500, frameW = 640, frameH = 384;
  const scale = Math.max(frameW / imgW, frameH / imgH);
  assert.equal(Math.round(imgW * scale), frameW, 'по ширине кадр входит целиком');
  const cutBottom = 1 - frameH / (imgH * scale);
  assert.ok(Math.abs(cutBottom - 0.1) < 0.005, `срез снизу ${cutBottom}`);
  assert.ok(cutBottom > 0.08, 'срез больше полосы надписи');
});

check('страница, компьютер: главное фото 640×384 (5:3), верх кадра; заглушка того же размера', () => {
  assert.equal(decl(slideCss, DESK, '.selectedImage', 'width'), '640px');
  assert.equal(decl(slideCss, DESK, '.selectedImage', 'height'), '384px');
  assert.equal(decl(slideCss, DESK, '.selectedImage', 'object-fit'), 'cover');
  assert.equal(decl(slideCss, DESK, '.selectedImage', 'object-position'), 'center top');
  assert.equal(decl(slideCss, DESK, '.image_placeholder', 'width'), '640px');
  assert.equal(decl(slideCss, DESK, '.image_placeholder', 'height'), '384px');
});

check('страница, компьютер: колонка миниатюр высотой с фото, 6 ячеек по 64 px, миниатюры 88×58 (широкие)', () => {
  assert.equal(decl(slideCss, DESK, '.sliderWrapper', 'height'), '384px');
  assert.equal(decl(slideCss, DESK, '.sliderWrapper :global(.slick-list)', 'height'), '384px !important');
  assert.equal(decl(slideCss, DESK, '.sliderWrapper :global(.slick-slide)', 'height'), '64px !important');
  assert.equal(decl(slideCss, DESK, '.sliderWrapper :global(.slick-slide > div)', 'height'), '64px');
  assert.equal(6 * 64, 384, 'slidesToShow 6 × 64 = высота фото');
  const w = decl(slideCss, DESK, '.thumbnail', 'width');
  const h = decl(slideCss, DESK, '.thumbnail', 'height');
  assert.equal(w, '88px');
  assert.equal(h, '58px', 'как в утверждённом макете: широкий кадр, ячейка 64 px с отступом');
  assert.equal(decl(slideCss, DESK, '.thumbnail', 'object-position'), 'center top');
  assert.match(read('src/components/UI/verticalSlide/index.tsx'), /slidesToShow: 6,/);
});

check('страница, телефон: слайдер 5:3 по ширине экрана (высота auto), заглушка тоже 5:3', () => {
  assert.equal(decl(slideCss, SLIDE_M, '.sliderWrapper', 'height'), 'auto');
  assert.equal(decl(slideCss, SLIDE_M, '.sliderWrapper :global(.slick-track)', 'height'), 'auto !important');
  assert.equal(decl(slideCss, SLIDE_M, '.sliderWrapper :global(.slick-slide)', 'height'), 'auto !important');
  assert.equal(decl(slideCss, SLIDE_M, '.thumbnail', 'width'), '100%');
  assert.equal(decl(slideCss, SLIDE_M, '.thumbnail', 'height'), 'auto');
  assert.equal(decl(slideCss, SLIDE_M, '.thumbnail', 'aspect-ratio'), '5 / 3');
  assert.equal(decl(slideCss, SLIDE_M, '.image_placeholder', 'aspect-ratio'), '5 / 3');
  assert.ok(!/300px/.test(slideCss.filter((r) => r.media === SLIDE_M).map((r) => r.body).join('')), 'нет старой высоты 300 px');
});

check('окно, компьютер: главное фото 5:3 по размеру окна (не больше 900 px), верх кадра; миниатюры 260×156', () => {
  assert.equal(decl(modalCss, DESK, '.mainImageWrapper', 'width'), 'min(900px, calc(100vw - 600px), calc((100vh - 220px) * 5 / 3))');
  assert.equal(decl(modalCss, DESK, '.mainImageWrapper', 'height'), 'auto');
  assert.equal(decl(modalCss, DESK, '.mainImageWrapper', 'aspect-ratio'), '5 / 3');
  assert.equal(decl(modalCss, DESK, '.mainImageWrapper', 'overflow'), 'hidden');
  assert.equal(decl(modalCss, DESK, '.mainImage', 'width'), '100%');
  assert.equal(decl(modalCss, DESK, '.mainImage', 'height'), '100%');
  assert.equal(decl(modalCss, DESK, '.mainImage', 'object-fit'), 'cover');
  assert.equal(decl(modalCss, DESK, '.mainImage', 'object-position'), 'center top');
  const w = decl(modalCss, DESK, '.thumbnailDesktop', 'width');
  const h = decl(modalCss, DESK, '.thumbnailDesktop', 'height');
  assert.ok(ratio(w, h), `${w}×${h}`);
  assert.equal(decl(modalCss, DESK, '.thumbnailDesktop', 'object-position'), 'center top');
  assert.equal(decl(modalCss, DESK, '.thumbnailSliderWrapperDesktop', 'height'), 'calc((156px + 16px) * 3)');
});

check('окно, телефон: главное фото на ширину экрана 5:3, миниатюры 5:3, верх кадра', () => {
  assert.equal(decl(modalCss, MODAL_M, '.mainImageWrapper', 'width'), 'calc(100vw - 24px)');
  assert.equal(decl(modalCss, MODAL_M, '.mainImageWrapper', 'aspect-ratio'), '5 / 3');
  assert.equal(decl(modalCss, MODAL_M, '.mainImage', 'width'), '100%');
  assert.equal(decl(modalCss, MODAL_M, '.mainImage', 'height'), '100%');
  assert.equal(decl(modalCss, MODAL_M, '.thumbnailMobile', 'aspect-ratio'), '5 / 3');
  assert.equal(decl(modalCss, MODAL_M, '.thumbnailMobile', 'object-position'), 'center top');
  assert.equal(decl(modalCss, MODAL_M, '.thumbnailSliderWrapperMobile', 'max-width'), 'calc(100vw - 24px)');
  assert.ok(!/734px|359px/.test(read('src/components/UI/galleryModal/galleryModal.module.css')), 'нет старых квадратных размеров');
});

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed ? 1 : 0);
