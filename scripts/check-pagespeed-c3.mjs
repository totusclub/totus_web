// PageSpeed C3–C4: шрифты только из репозитория (08.10: Google Fonts убраны; 09.10: Museo Sans Cyrl + Forum вместо Golos Text, свой знак ₽), тема слайдеров без шрифта slick,
// картинки ниже первого экрана грузятся по мере приближения. Запуск: node scripts/check-pagespeed-c3.mjs
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (rel) => fs.readFileSync(path.join(root, rel), 'utf8');
const code = (s) => s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:])\/\/.*$/gm, '$1');
const walk = (dir) => fs.readdirSync(path.join(root, dir), { withFileTypes: true }).flatMap((e) =>
  e.isDirectory() ? walk(path.join(dir, e.name)) : [path.join(dir, e.name)]);

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

const globals = read('src/styles/globals.css');
const doc = code(read('src/pages/_document.tsx'));
const app = code(read('src/pages/_app.tsx'));
const theme = read('src/styles/slick-theme.css');

console.log('PageSpeed: шрифт, слайдеры, картинки ниже экрана');

// ---- Шрифты (09.10: Museo Sans Cyrl + Forum вместо Golos Text, файлы в репозитории) ----
const FONT_DIR = 'src/assets/fonts';
// Чтение cmap из WOFF2 без зависимостей: заголовок, каталог таблиц, brotli (zlib), cmap формата 4 / 12.
const TAGS = ['cmap', 'head', 'hhea', 'hmtx', 'maxp', 'name', 'OS/2', 'post', 'cvt ', 'fpgm', 'glyf', 'loca', 'prep', 'CFF ', 'VORG', 'EBDT', 'EBLC', 'gasp', 'hdmx', 'kern', 'LTSH', 'PCLT', 'VDMX', 'vhea', 'vmtx', 'BASE', 'GDEF', 'GPOS', 'GSUB', 'EBSC', 'JSTF', 'MATH', 'CBDT', 'CBLC', 'COLR', 'CPAL', 'SVG ', 'sbix', 'acnt', 'avar', 'bdat', 'bloc', 'bsln', 'cvar', 'fdsc', 'feat', 'fmtx', 'fvar', 'gvar', 'hsty', 'just', 'lcar', 'mort', 'morx', 'opbd', 'prop', 'trak', 'Zapf', 'Silf', 'Glat', 'Gloc', 'Feat', 'Sill'];
function woff2Cmap(buf) {
  assert.equal(buf.toString('latin1', 0, 4), 'wOF2', 'не WOFF2');
  const numTables = buf.readUInt16BE(12);
  const compLen = buf.readUInt32BE(20);
  let p = 48;
  const b128 = () => { let v = 0; for (let i = 0; i < 5; i++) { const x = buf[p++]; v = v * 128 + (x & 0x7f); if (!(x & 0x80)) return v; } throw new Error('UIntBase128'); };
  const dir = [];
  for (let i = 0; i < numTables; i++) {
    const flags = buf[p++];
    let tag = TAGS[flags & 0x3f];
    if ((flags & 0x3f) === 63) { tag = buf.toString('latin1', p, p + 4); p += 4; }
    const ver = flags >> 6;
    const orig = b128();
    const transformed = (tag === 'glyf' || tag === 'loca') ? ver === 0 : ver !== 0;
    const len = transformed ? b128() : orig;
    dir.push({ tag, len });
  }
  const data = zlib.brotliDecompressSync(buf.subarray(p, p + compLen));
  let off = 0;
  const t = {};
  for (const d of dir) { t[d.tag] = data.subarray(off, off + d.len); off += d.len; }
  const c = t.cmap;
  const cps = new Set();
  const n = c.readUInt16BE(2);
  for (let i = 0; i < n; i++) {
    const pid = c.readUInt16BE(4 + i * 8), eid = c.readUInt16BE(6 + i * 8), o = c.readUInt32BE(8 + i * 8);
    const fmt = c.readUInt16BE(o);
    if (fmt === 4 && pid === 3 && eid === 1) {
      const segX2 = c.readUInt16BE(o + 6);
      const ends = o + 14, starts = ends + segX2 + 2, deltas = starts + segX2, ranges = deltas + segX2;
      for (let s = 0; s < segX2 / 2; s++) {
        const end = c.readUInt16BE(ends + s * 2), start = c.readUInt16BE(starts + s * 2);
        const delta = c.readInt16BE(deltas + s * 2), ro = c.readUInt16BE(ranges + s * 2);
        for (let ch = start; ch <= end && ch !== 0xffff; ch++) {
          let g;
          if (ro === 0) g = (ch + delta) & 0xffff;
          else { g = c.readUInt16BE(ranges + s * 2 + ro + (ch - start) * 2); if (g) g = (g + delta) & 0xffff; }
          if (g) cps.add(ch);
        }
      }
    } else if (fmt === 12) {
      const groups = c.readUInt32BE(o + 12);
      for (let g = 0; g < groups; g++) {
        const st = c.readUInt32BE(o + 16 + g * 12), en = c.readUInt32BE(o + 20 + g * 12);
        for (let ch = st; ch <= en; ch++) cps.add(ch);
      }
    }
  }
  return cps;
}
const fontFile = (name) => fs.readFileSync(path.join(root, FONT_DIR, name));
const faces = globals.match(/@font-face\s*\{[^}]*\}/g) || [];
const faceOf = (fam) => faces.filter((f) => f.includes(`font-family: "${fam}";`));

check('шрифты: только файлы из src/assets/fonts (WOFF2), без Google Fonts / CDN, font-display: swap', () => {
  assert.ok(faces.length >= 10, `@font-face: ${faces.length}`);
  for (const f of faces) {
    // ₽ (09.10, «Отель на телефоне»): шрифт из одного знака встроен в CSS — проверяется ниже отдельно
    if (f.includes('url(data:font/woff;base64,')) {
      assert.match(f, /unicode-range: U\+20BD;/, 'встроенный шрифт — только для ₽');
      assert.match(f, /font-display: swap;/);
      continue;
    }
    const m = f.match(/src: url\("\.\/\.\.\/assets\/fonts\/([\w.-]+\.woff2)"\) format\("woff2"\);/);
    assert.ok(m, `src не из assets/fonts: ${f.slice(0, 80)}`);
    assert.equal(fontFile(m[1]).toString('latin1', 0, 4), 'wOF2', m[1]);
    assert.match(f, /font-display: swap;/);
    assert.ok(!/https?:|\/\//.test(f.replace(/\/\*[\s\S]*?\*\//g, '').replace(/url\("\.\/\.\.\/assets/g, '')), 'внешний адрес в @font-face');
  }
  const css = walk('src').filter((f) => f.endsWith('.css')).map(read).join('\n');
  for (const f of [globals, doc, app, css]) assert.ok(!/fonts\.gstatic\.com|fonts\.googleapis\.com|@import\s+url\(\s*['"]?https?:/.test(f), 'нет Google Fonts / внешних CSS');
  assert.ok(!fs.existsSync(path.join(root, FONT_DIR, 'GolosText-VariableFont_wght.ttf')), 'старый файл Golos удалён');
});

check('шрифты: Museo Sans Cyrl 300/500/700/900, Forum, знаки (₽, стрелки) — с нужными символами', () => {
  const weights = faceOf('Museo Sans Cyrl').map((f) => f.match(/font-weight: ([\d ]+);/)[1]);
  assert.deepEqual(weights, ['100 399', '400 599', '600 799', '800 1000']);
  assert.equal(faceOf('Forum').length, 1);
  const need = (s) => [...s].map((ch) => ch.codePointAt(0));
  const RU = 'АБВГДЕЁЖЗИЙКЛМНОПРСТУФХЦЧШЩЪЫЬЭЮЯабвгдеёжзийклмнопрстуфхцчшщъыьэюя';
  const LAT = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  const PUNCT = '«»—–…№©%&@#*+=?!.,:;()[]/"\'öü';
  for (const name of ['MuseoSansCyrl-300.woff2', 'MuseoSansCyrl-500.woff2', 'MuseoSansCyrl-700.woff2', 'MuseoSansCyrl-900.woff2', 'Forum-Regular.woff2']) {
    const cps = woff2Cmap(fontFile(name));
    const miss = need(RU + LAT + PUNCT).filter((c) => !cps.has(c)).map((c) => String.fromCodePoint(c));
    assert.deepEqual(miss, [], `${name}: нет ${miss.join('')}`);
  }
  for (const name of ['GolosSymbols-500.woff2', 'GolosSymbols-700.woff2']) {
    const cps = woff2Cmap(fontFile(name));
    const miss = need('₽→←‑²').filter((c) => !cps.has(c)).map((c) => String.fromCodePoint(c));
    assert.deepEqual(miss, [], `${name}: нет ${miss.join('')}`);
  }
  // стрелки, дефис, ²³¹ — из подмножества Golos; ₽ — свой знак (см. проверку «знак рубля»)
  for (const f of [...faceOf('Totus Symbols'), ...faceOf('Golos Text')].filter((x) => x.includes('GolosSymbols'))) {
    assert.match(f, /unicode-range: U\+00B2-00B3, U\+00B9, U\+2010-2011, U\+2190-21FF;/);
  }
  // старое имя "Golos Text" (виджет Милы) — на файлах Museo и знаках
  assert.deepEqual(faceOf('Golos Text').filter((f) => !f.includes('url(data:')).map((f) => f.match(/fonts\/([\w.-]+)"/)[1]),
    ['MuseoSansCyrl-300.woff2', 'MuseoSansCyrl-500.woff2', 'MuseoSansCyrl-700.woff2', 'MuseoSansCyrl-900.woff2', 'GolosSymbols-500.woff2', 'GolosSymbols-700.woff2']);
});

check('знак рубля: свой ₽ под Museo (300/500/700) в «Totus Symbols» и «Golos Text», < 1 КБ, из scripts/ruble-glyph.json', () => {
  const glyph = JSON.parse(read('scripts/ruble-glyph.json'));
  for (const fam of ['Totus Symbols', 'Golos Text']) {
    const rub = faceOf(fam).filter((f) => f.includes('url(data:'));
    assert.deepEqual(rub.map((f) => f.match(/font-weight: ([\d ]+);/)[1]), ['100 399', '400 599', '600 1000'], fam);
    for (const f of rub) {
      const w = f.match(/font-weight: ([\d ]+);/)[1];
      const entry = Object.values(glyph.weights).find((x) => x.cssWeight === w);
      const b64 = f.match(/url\(data:font\/woff;base64,([A-Za-z0-9+/=]+)\) format\("woff"\);/)[1];
      assert.equal(b64, entry.woff, `${fam} ${w}: шрифт в CSS не совпадает с ruble-glyph.json`);
      const buf = Buffer.from(b64, 'base64');
      assert.equal(buf.toString('latin1', 0, 4), 'wOFF');
      assert.ok(buf.length < 1024, `${fam} ${w}: ${buf.length} байт`);
    }
  }
  // GolosSymbols больше не отвечает за ₽ ни в одном семействе
  for (const f of faces.filter((x) => x.includes('GolosSymbols'))) assert.ok(!/U\+20BD/.test(f));
});

check('шрифты: везде переменные --font-text / --font-heading, запасные шрифты без засечек; поля наследуют шрифт', () => {
  assert.match(globals, /--font-text: "Museo Sans Cyrl", "Totus Symbols", [^;]*, sans-serif;/);
  assert.match(globals, /--font-heading: "Forum", "Totus Symbols", [^;]*, serif;/);
  assert.match(globals, /body \{[\s\S]*?font-family: var\(--font-text\);/);
  assert.match(globals, /button,\s*input,\s*select,\s*textarea,\s*optgroup \{\s*font-family: inherit;/);
  const bad = [];
  for (const f of walk('src').filter((x) => x.endsWith('.css') && !x.endsWith('globals.css'))) {
    const body = read(f).replace(/\/\*[\s\S]*?\*\//g, '');
    for (const m of body.matchAll(/(?<![-\w])font-family\s*:\s*([^;}]*)/g)) {
      if (!/^(var\(--font-text\)|var\(--font-heading\)|inherit)\s*$/.test(m[1])) bad.push(`${f}: ${m[1]}`);
    }
  }
  assert.deepEqual(bad, []);
});

check('шрифты: Forum — заголовки и названия отелей (начертание 400, без отрицательной разрядки)', () => {
  const rule = (file, sel) => {
    const css = read(file).replace(/\/\*[\s\S]*?\*\//g, '');
    const esc = sel.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/\\>|>/g, '\\s*>\\s*').replace(/ /g, '\\s+');
    const m = css.match(new RegExp(`(^|[}\\s])${esc}\\s*\\{([^}]*)\\}`));
    assert.ok(m, `${file} ${sel}`);
    return m[2];
  };
  const heads = [
    ['src/components/hotelCard/hotelCard.module.css', '.hotelCardName > p'],
    ['src/components/hotelBox/hotelBox.module.css', '.hotelBoxCardName>p'],
    ['src/components/hotelDetails/hotelDetails.module.css', '.HotelDetailsHeaderName'],
    ['src/components/favorites/favorites.module.css', '.title'],
    ['src/components/selectedTour/selectedtour.module.css', '.selectedTourName'],
    ['src/components/home/home.module.css', '.hotProductTitle'],
    ['src/components/home/home.module.css', '.faqContainer > p'],
    ['src/components/search/search.module.css', '.searchTitle'],
    ['src/components/UI/collapse/collapse.module.css', '.collapseTitle'],
    ['src/components/staticInfoPage/staticInfoPage.module.css', '.title'],
  ];
  for (const [f, s] of heads) {
    const b = rule(f, s);
    assert.match(b, /font-family: var\(--font-heading\);/, `${f} ${s}`);
    assert.match(b, /font-weight: 400;/, `${f} ${s}`);
    assert.ok(!/letter-spacing:\s*-/.test(b), `${f} ${s}: отрицательная разрядка`);
  }
  // цены и обычный текст — не Forum
  for (const [f, s] of [['src/components/hotelBox/hotelBox.module.css', '.hotelBoxCardPrice'], ['src/components/hotelCard/hotelCard.module.css', '.hotelCardCheckout > p']]) {
    assert.ok(!/--font-heading/.test(rule(f, s)), `${f} ${s}`);
  }
});

check('тема слайдеров: своя, без шрифта slick и gif; подключена в _app; в компонентах не импортируется', () => {
  assert.match(app, /import '\.\.\/styles\/slick-theme\.css';/);
  assert.ok(!/@font-face|font-family|ajax-loader|url\(/.test(theme.replace(/\/\*[\s\S]*?\*\//g, '')));
  assert.match(theme, /\.slick-dots li button:before \{[\s\S]*content: '•';/);
  const users = walk('src').filter((f) => /\.(tsx?|jsx?)$/.test(f)).filter((f) => read(f).includes('slick-theme.css') && !f.endsWith('_app.tsx'));
  assert.deepEqual(users, []);
});

check('фото направлений: фон только когда блок рядом с экраном (desktop и mobile отдельно)', () => {
  const s = code(read('src/components/home/popularDestinations.tsx'));
  assert.match(s, /<div className=\{styles\.recomendDeslist\} ref=\{desktopListRef\}>/);
  assert.match(s, /<div className=\{styles\.recomendDeslistMob\} ref=\{mobileListRef\}>/);
  assert.match(s, /backgroundImage: desktopListVisible && destinationImage \? `url\(\$\{destinationImage\}\)` : undefined/);
  assert.match(s, /backgroundImage: mobileListVisible && item\?\.image \? `url\(\$\{item\.image\}\)` : undefined/);
});

check('фото отелей в «Начните планирование»: только когда блок рядом с экраном', () => {
  const s = code(read('src/components/home/hotDeals.tsx'));
  assert.match(s, /showImage=\{desktopListVisible( && pageLoaded)?\}/);
  assert.match(s, /showImage=\{mobileListVisible( && pageLoaded)?\}/);
  const card = code(read('src/components/hotelBox/hotelBoxCard.tsx'));
  assert.match(card, /showImage = true \}: ProductCardProps/);
  assert.match(card, /style=\{showImage && image \? \{backgroundImage: `url\(\$\{image\}\)`\} : undefined\}/);
});

check('блок «Оставьте номер»: layer.png и girl.png только когда блок рядом с экраном', () => {
  const css = read('src/components/home/home.module.css');
  const c = code(read('src/components/home/callRequest.tsx'));
  assert.equal((css.match(/url\("\/images\/layer\.png"\)/g) || []).length, 1);
  assert.match(css, /\.callRequestLeyerLoaded \{\s*(background-color: lightgray;\s*)?background-image: url\("\/images\/layer\.png"\);/);
  assert.match(css, /\.callRequestGirlLoaded \{\s*background-image: url\("\/images\/girl\.png"\);/);
  assert.match(c, /blockVisible \? styles\.callRequestLeyerLoaded : ''/);
  assert.match(c, /blockVisible \? styles\.callRequestGirlLoaded : ''/);
});

check('useNearViewport: IntersectionObserver, один раз true, без IO — сразу true', () => {
  const h = code(read('src/hooks/useNearViewport.ts'));
  assert.match(h, /new window\.IntersectionObserver\(/);
  assert.match(h, /setVisible\(true\);\s*observer\.disconnect\(\);/);
  assert.match(h, /typeof window\.IntersectionObserver === 'undefined'\) \{\s*setVisible\(true\);/);
});

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed ? 1 : 0);
