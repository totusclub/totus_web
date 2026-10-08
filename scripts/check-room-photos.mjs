// Фото номеров на странице отеля: те же кадры 5:3 с привязкой к верху, что у фото отеля (#51),
// — нижняя полоса с надписью Level.Travel не видна. Окно с фото — общий GalleryModal (уже 5:3).
// Запуск: node scripts/check-room-photos.mjs
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

const small = rules(read('src/components/UI/smallSlide/smallSlide.module.css'));
const hd = rules(read('src/components/hotelDetails/hotelDetails.module.css'));
const appImage = read('src/components/UI/appImage/index.tsx');
const slider = read('src/components/UI/smallSlide/index.tsx');
const room = read('src/components/hotelDetails/hotelDetailsRooms/roomItem.tsx');
const M768 = '@media (max-width: 768px)';

console.log('Фото номеров: 5:3, без надписи Level.Travel');

check('главное фото номера (AppImage): рамка 5:3, cover, верх кадра; без фиксированных 200/220 px', () => {
  assert.match(appImage, /aspectRatio: "5 \/ 3",/);
  assert.match(appImage, /objectFit: "cover",\s*objectPosition: "center top",/);
  assert.match(appImage, /width: "100%",\s*height: "100%",/);
  assert.ok(!/200px|220px|paddingTop/.test(appImage), 'старые размеры убраны');
  assert.match(appImage, /loading="lazy"/);
  assert.match(appImage, /\{imageUrl \? \(/, 'пока адреса нет — без <img src="">');
});

check('миниатюры номера: 5:3, cover, верх кадра; ячейка по высоте картинки (компьютер и телефон)', () => {
  assert.equal(decl(small, '', '.thumbnail', 'aspect-ratio'), '5 / 3');
  assert.equal(decl(small, '', '.thumbnail', 'height'), 'auto');
  assert.equal(decl(small, '', '.thumbnail', 'object-fit'), 'cover');
  assert.equal(decl(small, '', '.thumbnail', 'object-position'), 'center top');
  assert.equal(decl(small, '', '.slideItem', 'height'), 'auto');
  assert.equal(decl(small, M768, '.slideItem', 'height'), 'auto');
  assert.ok(!/height: 120%|height: 88px/.test(read('src/components/UI/smallSlide/smallSlide.module.css')), 'старые размеры убраны');
  assert.match(slider, /className=\{styles\.thumbnail\}/);
});

check('номер с одним фото: рамка 5:3 (компьютер 279 px, телефон на ширину), верх кадра; заглушка без min-height', () => {
  assert.equal(decl(hd, '', '.HotelDetailsRoomImage', 'width'), '279px');
  assert.equal(decl(hd, '', '.HotelDetailsRoomImage', 'height'), 'auto');
  assert.equal(decl(hd, '', '.HotelDetailsRoomImage', 'aspect-ratio'), '5 / 3');
  assert.equal(decl(hd, '', '.HotelDetailsRoomImage > img', 'object-position'), 'center top');
  assert.equal(decl(hd, M768, '.HotelDetailsRoomImage', 'width'), '100%');
  assert.equal(decl(hd, M768, '.HotelDetailsRoomImage', 'height'), 'auto');
  assert.equal(decl(hd, '', '.HotelDetailsRoomImagePlaceholder', 'min-height'), undefined);
  assert.match(room, /className=\{styles\.HotelDetailsRoomImage\}/);
});

check('окно с фото номера — общий GalleryModal (5:3, верх кадра из #51)', () => {
  assert.match(room, /<GalleryModal/);
  assert.match(slider, /<GalleryModal/);
  const modal = rules(read('src/components/UI/galleryModal/galleryModal.module.css'));
  assert.equal(decl(modal, '', '.mainImageWrapper', 'aspect-ratio'), '5 / 3');
  assert.equal(decl(modal, '', '.mainImage', 'object-position'), 'center top');
  assert.equal(decl(modal, M768, '.mainImageWrapper', 'aspect-ratio'), '5 / 3');
});

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed ? 1 : 0);
