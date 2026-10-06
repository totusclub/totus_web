// Проверка: избранное, добавленное на сайте, показывает фото и в приложении (поле `uri`),
// записи приложения по-прежнему показываются на сайте.
// Запуск: node scripts/check-favorites-sync.mjs   (Node >= 22.18, без npm install)
//
// Владелец 06.10.2026: отель, добавленный в избранное на сайте, в приложении без изображения.
// Сайт сохранял картинку как {webp_x620, x500, …}; React Native <Image> рисует только {uri}.

import assert from 'node:assert/strict';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
if (!process.features || !process.features.typescript) {
  console.log('SKIP: нужен Node >= 22.18 (type stripping)');
  process.exit(0);
}
const fav = await import(pathToFileURL(path.join(root, 'src/utils/favoriteHotelDisplay.ts')).href);

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

console.log('Избранное: сайт ↔ приложение');

check('сайт сохраняет картинку с `uri` (абсолютный https, JPEG раньше WebP) и прежними полями', () => {
  const payload = fav.buildSlimFavoriteHotelPayload(
    { id: 77, name: 'Rixos', images: [{ webp_x620: 'webp/620/a.webp', x620: 'jpg/620/a.jpg', x500: '//img.cdn.level.travel/jpg/500/a.jpg' }] },
    77,
  );
  const img = payload.images[0];
  assert.equal(img.uri, 'https://img.cdn.level.travel/jpg/620/a.jpg');
  assert.equal(img.webp_x620, 'https://img.cdn.level.travel/webp/620/a.webp');
  assert.equal(img.x500, 'https://img.cdn.level.travel/jpg/500/a.jpg');
});

check('картинка-строка и только WebP — тоже с `uri`', () => {
  const a = fav.buildSlimFavoriteHotelPayload({ id: 1, name: 'A', images: ['https://cdn/x.jpg'] }, 1);
  assert.equal(a.images[0].uri, 'https://cdn/x.jpg');
  const b = fav.buildSlimFavoriteHotelPayload({ id: 2, name: 'B', images: [{ webp_x620: 'https://cdn/y.webp' }] }, 2);
  assert.equal(b.images[0].uri, 'https://cdn/y.webp');
});

check('сайт показывает фото записей из приложения ({uri}) и своих — как раньше', () => {
  assert.equal(fav.pickHotelImageUrl({ images: [{ uri: 'https://img.cdn.level.travel/x/1.jpg' }] }), 'https://img.cdn.level.travel/x/1.jpg');
  const own = fav.pickHotelImageUrl({ images: [{ webp_x620: 'https://cdn/a.webp', x500: 'https://cdn/a.jpg', uri: 'https://cdn/a.jpg' }] });
  assert.equal(own, 'https://cdn/a.webp', 'сайт по-прежнему берёт webp_x620');
});

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed ? 1 : 0);
