// Страница отеля на телефоне и планшете (до 1024 px) — вариант C «Без карточек», утверждён 09.10.2026,
// и единый знак ₽ на всём сайте. Компьютер (> 1024 px) не меняется.
// Запуск: node scripts/check-hotel-mobile.mjs (без npm install).
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (rel) => fs.readFileSync(path.join(root, rel), 'utf8');
const noComments = (s) => s.replace(/\/\*[\s\S]*?\*\//g, '');
const code = (s) => noComments(s).replace(/(^|[^:])\/\/.*$/gm, '$1');

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

/** Все правила файла: { media, selector, body } (вложенные @media разворачиваются). */
function rules(css) {
  const out = [];
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
      else if (!head.startsWith('@keyframes')) out.push({ media, selector: head.replace(/\s+/g, ' '), body });
      i = j;
    }
  };
  walk(noComments(css), '');
  return out;
}
/** Последнее значение свойства для селектора в данном @media. */
function decl(list, media, selector, prop) {
  let value;
  for (const r of list.filter((x) => x.media === media && x.selector.split(',').map((s) => s.trim()).includes(selector))) {
    for (const m of r.body.matchAll(new RegExp(`(?:^|;|\\s)${prop}\\s*:\\s*([^;]+);`, 'g'))) value = m[1].trim();
  }
  return value;
}

const TAB = '@media (max-width: 1024px)';
const hdCss = read('src/components/hotelDetails/hotelDetails.module.css');
const hd = rules(hdCss);
const search = rules(read('src/components/hotelDetails/hotelSearchSection/hotelSearchSection.module.css'));
const slide = rules(read('src/components/UI/verticalSlide/verticalSlide.module.css'));
const page = code(read('src/pages/hotel-details/index.tsx'));

console.log('Страница отеля на телефоне (вариант C) и знак ₽');

check('страница на основном фоне; класс HotelDetailsPage на всех <main> страницы отеля', () => {
  assert.equal(decl(hd, TAB, '.HotelDetailsPage', 'background'), 'var(--bgPrimary)');
  assert.match(page, /import hotelStyles from "@\/components\/hotelDetails\/hotelDetails\.module\.css";/);
  assert.equal((page.match(/<main className=\{`searchContainer \$\{hotelStyles\.HotelDetailsPage\}`\}>/g) || []).length, 4);
  assert.ok(!/<main className=\{'searchContainer'\}>/.test(page));
});

check('разделы во всю ширину, полоса 8 px между ними (описание, номера, поиск)', () => {
  for (const sel of ['.HotelDetailsDesc', '.HotelDetailsRooms']) {
    assert.equal(decl(hd, TAB, sel, 'width'), 'calc(100% + 32px)', sel);
    assert.equal(decl(hd, TAB, sel, 'margin'), '0 -16px', sel);
    assert.equal(decl(hd, TAB, sel, 'border-radius'), '0', sel);
    assert.equal(decl(hd, TAB, sel, 'border-top'), '8px solid var(--bgSecondary)', sel);
  }
  assert.equal(decl(search, TAB, '.hotelSearchSection', 'width'), 'calc(100% + 32px)');
  assert.equal(decl(search, TAB, '.hotelSearchSection', 'margin'), '0 -16px');
  assert.equal(decl(search, TAB, '.hotelSearchSection', 'padding'), '16px');
  assert.equal(decl(search, TAB, '.hotelSearchSection', 'border-top'), '8px solid var(--bgSecondary)');
});

check('отступы: заголовки разделов 20/16/4, поля 16, шапка → фото 8, фото → цена 12, цена → разделы 16', () => {
  for (const sel of ['.HotelDetailsDescHead', '.HotelDetailsRoomsHead']) {
    assert.equal(decl(hd, TAB, sel, 'padding'), '20px 16px 4px', sel);
    assert.equal(decl(hd, TAB, sel, 'border-bottom'), 'none', sel);
  }
  assert.equal(decl(hd, TAB, '.HotelDetailsDesc', 'padding-bottom'), '16px');
  assert.equal(decl(hd, TAB, '.HotelDetailsDescItems', 'padding'), '12px 16px 0');
  assert.equal(decl(hd, TAB, '.HotelDetailsHeader', 'margin-bottom'), '8px');
  assert.equal(decl(hd, TAB, '.HotelDetailsInfoRow', 'gap'), '12px');
  assert.equal(decl(hd, TAB, '.HotelDetailsInfo', 'margin-bottom'), '16px');
  assert.equal(decl(hd, TAB, '.HotelDetailsInfoPrice', 'margin-top'), '0');
  assert.equal(decl(hd, TAB, '.HotelDetailsInfoPrice', 'padding'), '16px');
  assert.equal(decl(hd, TAB, '.HotelDetailsRoomFilters', 'padding'), '12px 16px');
});

check('скругления: цена, фильтры, поиск, предложения 16; фото 12; теги 12; номер без карточки', () => {
  assert.equal(decl(hd, TAB, '.HotelDetailsInfoPrice', 'border-radius'), '16px');
  assert.equal(decl(hd, TAB, '.HotelDetailsInfoPrice', 'background'), 'var(--bgSecondary)');
  assert.equal(decl(hd, TAB, '.HotelDetailsRoomFilterTrigger', 'border-radius'), '16px');
  assert.equal(decl(hd, TAB, '.HotelDetailsPriceListItems', 'border-radius'), '16px');
  assert.equal(decl(search, TAB, '.searchFields', 'border-radius'), '16px');
  assert.equal(decl(search, TAB, '.searchFields', 'overflow'), 'hidden');
  for (const sel of ['.HotelDetailsRoomImage', '.HotelDetailsRoomImagePlaceholder', '.image_placeholder']) {
    assert.equal(decl(hd, TAB, sel, 'border-radius'), '12px', sel);
  }
  assert.equal(decl(slide, TAB, '.thumbnail', 'border-radius'), '12px');
  assert.equal(decl(slide, TAB, '.image_placeholder', 'border-radius'), '12px');
  for (const sel of ['.HotelDetailsDescItem', '.HotelDetailsRoomfacilitiesItem']) {
    assert.equal(decl(hd, TAB, sel, 'border-radius'), '12px', sel);
    assert.equal(decl(hd, TAB, sel, 'padding'), '4px 10px', sel);
  }
  for (const sel of ['.HotelDetailsRoomItem', '.HotelDetailsRoomFilters ~ .HotelDetailsRoomItem', '.HotelDetailsRoomFilters ~ .HotelDetailsRoomItem ~ .HotelDetailsRoomItem']) {
    assert.equal(decl(hd, TAB, sel, 'margin'), '0', sel);
    assert.equal(decl(hd, TAB, sel, 'border-radius'), '0', sel);
    assert.equal(decl(hd, TAB, sel, 'border-top'), '1px solid var(--borderTertiary)', sel);
  }
  // кнопка «Выбрать» у предложения остаётся таблеткой 44 px (макет 08.10)
  assert.equal(decl(hd, '@media (max-width: 768px)', '.HotelDetailsPriceListItem .mobButton > div', 'border-radius'), '22px !important');
});

check('тёмная тема: оценка белая на зелёном, линии заметнее фона тегов', () => {
  assert.equal(decl(hd, TAB, '.hotelCardImageInfo > p:nth-child(1)', 'color'), '#ffffff');
  assert.equal(decl(hd, TAB, ':global([data-theme="dark"]) .HotelDetailsPage', '--borderTertiary'), '#2c2c2c');
});

check('компьютер (> 1024 px) не тронут', () => {
  assert.equal(decl(hd, '', '.HotelDetailsDesc', 'border-radius'), '20px');
  assert.equal(decl(hd, '', '.HotelDetailsDesc', 'margin'), '24px 0');
  assert.equal(decl(hd, '', '.HotelDetailsRoomItem', 'margin'), '0 16px 16px 16px');
  assert.equal(decl(hd, '', '.HotelDetailsRoomItem', 'border-radius'), '16px');
  assert.equal(decl(hd, '', '.HotelDetailsHeader', 'margin-bottom'), '32px');
  assert.equal(decl(hd, '', '.HotelDetailsPage', 'background'), undefined);
  assert.equal(decl(search, '', '.hotelSearchSection', 'margin'), '24px 0');
  assert.equal(decl(slide, '', '.thumbnail', 'border-radius'), '8px');
  // блок варианта C — последний в файле, только до 1024 px
  const tail = hdCss.slice(hdCss.lastIndexOf('вариант C'));
  assert.ok(!/@media \(min-width/.test(tail));
});

// ---- знак ₽ и запись цены ----
check('единая запись цены: тысячи — U+202F, перед ₽ — U+00A0 (константы в formatPrice, остальные берут их)', () => {
  const fp = code(read('src/utils/formatPrice.ts'));
  assert.match(fp, /export const THOUSANDS_SEP = String\.fromCharCode\(0x202f\);/);
  assert.match(fp, /export const RUB_SUFFIX = `\$\{String\.fromCharCode\(0xa0\)\}₽`;/);
  assert.match(fp, /`\$\{formatted\}\$\{RUB_SUFFIX\}`/);
  assert.match(fp, /`от \$\{formatted\}\$\{RUB_SUFFIX\}`/);
  assert.match(code(read('src/utils/packagePrice.ts')), /return `\$\{groupThousands\(Math\.round\(toMoney\(value\)\)\)\}\$\{RUB_SUFFIX\}`;/);
  assert.match(code(read('src/utils/totusBooking.ts')), /NARROW_NBSP\)\}\$\{RUB_SUFFIX\}`;/);
  assert.match(code(read('src/utils/orderDisplay.ts')), /return `\$\{groupThousands\(Number\(amount\)\)\}\$\{RUB_SUFFIX\}`;/);
  assert.match(code(read('src/utils/filterChips.ts')), /`от \$\{formatPrice\(min\)\}\$\{RUB_SUFFIX\} – до \$\{formatPrice\(max\)\}\$\{RUB_SUFFIX\}`/);
});

check('₽ нигде не приклеен к числу и не отделён обычным пробелом', () => {
  const files = [
    'src/components/hotelDetails/hotelDetailsInfo/index.tsx',
    'src/components/hotelCard/index.tsx',
    'src/components/UI/checkboxGroup/index.tsx',
    'src/components/ticketItem/index.tsx',
    'src/components/selectedTour/index.tsx',
    'src/components/profile/orderDetails/OrderDetailsHeader.tsx',
    'src/utils/formatPrice.ts',
    'src/utils/packagePrice.ts',
    'src/utils/totusBooking.ts',
    'src/utils/orderDisplay.ts',
    'src/utils/filterChips.ts',
  ];
  for (const f of files) {
    const s = code(read(f));
    assert.ok(!/[}\d ]₽|\n\s*₽/.test(s.replace(/fromCharCode\(0xa0\)\}₽/g, '')), `${f}: ₽ без неразрывного пробела`);
    assert.ok(!/replace\(' ₽', '₽'\)/.test(s), `${f}: склейка ₽`);
  }
  assert.match(code(read('src/components/hotelDetails/hotelDetailsInfo/index.tsx')), /от \{priceFormatted\}\{RUB_SUFFIX\}<\/p>/);
  assert.equal((code(read('src/components/hotelCard/index.tsx')).match(/\{RUB_SUFFIX\}<\/p>/g) || []).length, 2);
  assert.equal((code(read('src/components/UI/checkboxGroup/index.tsx')).match(/\{RUB_SUFFIX\}/g) || []).length, 2);
  assert.equal((code(read('src/components/profile/orderDetails/OrderDetailsHeader.tsx')).match(/\{price\}\{RUB_SUFFIX\}<\/p>/g) || []).length, 2);
});

check('знак ₽ — свой (Totus Symbols / Golos Text, U+20BD), Golos-подмножество больше не отвечает за ₽', () => {
  const g = read('src/styles/globals.css');
  const faces = g.match(/@font-face\s*\{[^}]*\}/g) || [];
  const rub = faces.filter((f) => /unicode-range: U\+20BD;/.test(f));
  assert.equal(rub.length, 6);
  for (const f of rub) assert.match(f, /src: url\(data:font\/woff;base64,[A-Za-z0-9+/=]+\) format\("woff"\);/);
  for (const f of faces.filter((x) => x.includes('GolosSymbols'))) assert.ok(!/U\+20BD/.test(f));
  assert.match(g, /--font-text: "Museo Sans Cyrl", "Totus Symbols",/);
});

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed ? 1 : 0);
