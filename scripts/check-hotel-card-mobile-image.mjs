// Мобильная выдача отелей: фото карточки как в приложении (totus_APP ResultList → HotelCard imageHeight 200).
// Запуск: node scripts/check-hotel-card-mobile-image.mjs (без npm install).
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const css = fs.readFileSync(path.join(root, 'src/components/hotelCard/hotelCard.module.css'), 'utf8');
const mobile = css.slice(css.indexOf('@media (max-width: 768px)'));
const rule = (src, sel) => (src.match(new RegExp(`\\${sel} \\{([^}]*)\\}`)) || [])[1] || '';

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

console.log('Мобильная выдача: фото карточки отеля');

check('телефон: фото на всю ширину карточки, высота 200 (как в приложении), cover по центру', () => {
  const r = rule(mobile, '.hotelCardImage');
  assert.match(r, /width: 100%;/);
  assert.match(r, /height: 200px;/);
  assert.match(r, /background-size: cover;/);
  assert.match(r, /background-position: center;/);
  assert.match(rule(css, '.hotelCardImage'), /border-radius: 8px;/, 'радиус 8, как в приложении');
});

check('заглушка загрузки на телефоне — той же высоты 200', () => {
  assert.match(rule(mobile, '.image_placeholder'), /height: 200px;/);
});

check('компьютер без изменений: 212×152', () => {
  const r = rule(css, '.hotelCardImage');
  assert.match(r, /width: 212px;/);
  assert.match(r, /height: 152px;/);
});

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed ? 1 : 0);
