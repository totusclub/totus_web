// Окно «Все фото» на странице отеля: справа в шапке — название отеля;
// окно фото номера — название номера. Запуск: node scripts/check-gallery-titles.mjs
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (rel) => fs.readFileSync(path.join(root, rel), 'utf8');

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

const modal = read('src/components/UI/galleryModal/index.tsx');
const css = read('src/components/UI/galleryModal/galleryModal.module.css');
const vertical = read('src/components/UI/verticalSlide/index.tsx');
const small = read('src/components/UI/smallSlide/index.tsx');
const room = read('src/components/hotelDetails/hotelDetailsRooms/roomItem.tsx');
const info = read('src/components/hotelDetails/hotelDetailsInfo/index.tsx');

console.log('Шапка окна с фото: название отеля / номера');

check('GalleryModal: проп title, заголовок в шапке перед кнопкой закрытия', () => {
  assert.match(modal, /title\?: string;/);
  const header = modal.slice(modal.indexOf('className={styles.modalHeader}'), modal.indexOf('className={styles.galleryContainer}'));
  assert.ok(header.indexOf('styles.modalTitle') > 0, 'заголовок в шапке');
  assert.ok(header.indexOf('styles.modalTitle') < header.indexOf('styles.closeButton'), 'заголовок слева от кнопки закрытия (справа в шапке)');
  assert.match(header, /\{headerTitle \? \(/, 'без названия шапка как раньше');
  assert.match(modal, /contentLabel="Фотографии"/, 'имя окна для a11y не меняется');
});

check('стили: прижат вправо, одна строка на компьютере, две на телефоне, крестик не сжимается', () => {
  const t = css.match(/\.modalTitle \{([^}]*)\}/)[1];
  assert.match(t, /margin: 0 0 0 auto;/);
  assert.match(t, /min-width: 0;/);
  assert.match(t, /text-overflow: ellipsis;/);
  assert.match(t, /white-space: nowrap;/);
  const mob = css.slice(css.indexOf('@media (max-width: 768px)'));
  assert.match(mob, /\.modalTitle \{[^}]*-webkit-line-clamp: 2;/);
  assert.match(css.match(/\.closeButton \{([^}]*)\}/)[1], /flex-shrink: 0;/);
});

check('фото отеля: название отеля → VerticalSlider → GalleryModal', () => {
  assert.match(info, /const hotelName = typeof hotel\?\.name === "string" \? hotel\.name : "";/);
  assert.equal((info.match(/<VerticalSlider [^>]*title=\{hotelName\}/g) || []).length, 2, 'оба места (загрузка и готово)');
  assert.match(vertical, /\(\{ images, loading, title \}: any\)/);
  assert.match(vertical, /<GalleryModal[\s\S]{0,400}title=\{title\}/);
});

check('фото номера: название номера → SmallSlider и одиночное фото → GalleryModal', () => {
  assert.match(room, /const roomName: string = item\?\.room\?\.name_ru \|\| item\?\.room\?\.name \|\| '';/);
  assert.match(room, /<SmallSlider images=\{roomImages\} title=\{roomName\} \/>/);
  assert.match(room, /<GalleryModal[\s\S]{0,400}title=\{roomName\}/);
  assert.match(small, /<GalleryModal[\s\S]{0,400}title=\{title\}/);
});

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed ? 1 : 0);
