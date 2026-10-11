// Картинки hero главной для public/hero (src/config/homeHero.ts): AVIF + WebP, телефон и компьютер.
//
// По умолчанию берёт три текущие картинки с API (как они стояли в админке): WebP сохраняются
// без изменений (вид тот же), AVIF делается из них. Можно подставить свою картинку:
//   node scripts/hero-assets.mjs hero-2=~/Pictures/beach.jpg
// тогда для hero-2 из исходника делаются обе версии: компьютер (ширина до 2010 px) и телефон
// (центр-кроп 900:783 во всю высоту, как делал бэкенд в lib/heroMobile.js).
//
// Нужен sharp (в package.json его нет и добавлять не нужно):
//   npm i --no-save sharp && node scripts/hero-assets.mjs
// Затем: git add public/hero && git commit.
// После замены картинки поменяйте имя файла (кеш браузера на год — next.config.ts, public/hero/README.md).
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT = path.join(root, 'public', 'hero');

/** Текущие картинки админки (sort_order 0, 1, 2) → hero-1..3. */
const API_HERO = 'https://api.totus.club/uploads/hero/';
const SOURCES = [
  { name: 'hero-1', file: '1791384594380-322827423.webp' },
  { name: 'hero-2', file: '1791384643564-633967271.webp' },
  { name: 'hero-3', file: '1791384651500-63803385.webp' },
];

/** AVIF: качество 50 (по замеру на этих картинках — на 30–70 % легче WebP без видимой разницы). */
const AVIF = { quality: 50, effort: 6 };
const WEBP = { quality: 80, effort: 6 };
const DESKTOP_MAX_WIDTH = 2010;
const MOBILE_RATIO = 900 / 783;
const MOBILE_MAX_WIDTH = 900;

async function loadSharp() {
  try {
    return (await import('sharp')).default;
  } catch {
    console.error('Нужен sharp: npm i --no-save sharp && node scripts/hero-assets.mjs');
    process.exit(1);
  }
}

async function download(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`${url}: HTTP ${res.status}`);
  return Buffer.from(await res.arrayBuffer());
}

const kb = (n) => `${Math.round(n / 1024)} КБ`;

/** Своя картинка: компьютер + телефон из одного исходника. */
async function fromSource(sharp, input) {
  const meta = await sharp(input).metadata();
  const desktop = await sharp(input)
    .resize({ width: Math.min(DESKTOP_MAX_WIDTH, meta.width), withoutEnlargement: true })
    .toBuffer();
  const d = await sharp(desktop).metadata();
  const cropW = Math.min(d.width, Math.round(d.height * MOBILE_RATIO));
  const mobile = await sharp(desktop)
    .extract({ left: Math.floor((d.width - cropW) / 2), top: 0, width: cropW, height: d.height })
    .resize({ width: Math.min(MOBILE_MAX_WIDTH, cropW), withoutEnlargement: true })
    .toBuffer();
  return {
    desktopWebp: await sharp(desktop).webp(WEBP).toBuffer(),
    mobileWebp: await sharp(mobile).webp(WEBP).toBuffer(),
  };
}

async function main() {
  const sharp = await loadSharp();
  const overrides = Object.fromEntries(
    process.argv.slice(2).map((arg) => {
      const [name, file] = arg.split('=');
      return [name, file && file.replace(/^~(?=\/)/, os.homedir())];
    }),
  );
  fs.mkdirSync(OUT, { recursive: true });
  let total = 0;
  for (const src of SOURCES) {
    let desktopWebp;
    let mobileWebp;
    if (overrides[src.name]) {
      ({ desktopWebp, mobileWebp } = await fromSource(sharp, fs.readFileSync(overrides[src.name])));
    } else {
      desktopWebp = await download(API_HERO + src.file);
      mobileWebp = await download(`${API_HERO}${src.file}.m.webp`);
    }
    const files = {
      [`${src.name}.webp`]: desktopWebp,
      [`${src.name}.avif`]: await sharp(desktopWebp).avif(AVIF).toBuffer(),
      [`${src.name}-m.webp`]: mobileWebp,
      [`${src.name}-m.avif`]: await sharp(mobileWebp).avif(AVIF).toBuffer(),
    };
    for (const [name, buf] of Object.entries(files)) {
      fs.writeFileSync(path.join(OUT, name), buf);
      const m = await sharp(buf).metadata();
      total += buf.length;
      console.log(`  ${name.padEnd(16)} ${String(m.width).padStart(4)}×${m.height}  ${kb(buf.length)}`);
    }
  }
  console.log(`\nГотово: public/hero, всего ${kb(total)}. Дальше: git add public/hero && git commit`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
