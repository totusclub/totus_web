// Яндекс Метрика грузится после загрузки страницы (мобильный PageSpeed: tag.js ~64 КБ был в окне LCP).
// Проверяет настоящий код из src/pages/_app.tsx: очередь ym() и init — сразу, tag.js — только после
// load и паузы браузера, один раз; параметры счётчика не изменились.
// Запуск: node scripts/check-metrika-deferred.mjs (без npm install).
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const app = fs.readFileSync(path.join(root, 'src/pages/_app.tsx'), 'utf8');

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

const TAG = 'https://mc.yandex.ru/metrika/tag.js?id=106173650';
const block = app.slice(app.indexOf('id="yandex-metrika"'));
const snippet = (block.match(/__html: `([\s\S]*?)`,/) || [])[1] || '';

/** Минимальные window/document: хватает для сниппета Метрики. */
function makeEnv({ readyState = 'loading', idle = true, existing = false } = {}) {
  const inserted = [];
  const listeners = {};
  const idleQueue = [];
  const timers = [];
  const scripts = existing ? [{ src: TAG }] : [{ src: 'https://totus.club/_next/static/chunks/main.js' }];
  const document = {
    readyState,
    scripts,
    createElement: (tag) => ({ tagName: tag, src: '', async: 0 }),
    getElementsByTagName: () => [{ parentNode: { insertBefore: (el) => { inserted.push(el); scripts.push(el); } } }],
  };
  const window = {
    addEventListener: (type, fn, opts) => { listeners[type] = { fn, opts }; },
  };
  if (idle) window.requestIdleCallback = (fn, opts) => { idleQueue.push({ fn, opts }); };
  const ctx = { window, document, setTimeout: (fn, ms) => { timers.push({ fn, ms }); }, Date };
  ctx.ym = undefined;
  vm.createContext(ctx);
  // в браузере ym — глобальная переменная = window.ym
  Object.defineProperty(ctx, 'ym', { get: () => window.ym, set: (v) => { window.ym = v; } });
  return { ctx, window, document, inserted, listeners, idleQueue, timers };
}

console.log('Яндекс Метрика после загрузки страницы');

check('сниппет найден в _app.tsx, стратегия afterInteractive (очередь ym до гидрации не нужна)', () => {
  assert.ok(snippet.length > 100, 'нет __html у Script id="yandex-metrika"');
  assert.match(block, /^id="yandex-metrika"\s*strategy="afterInteractive"/);
});

check('до события load tag.js не вставляется, init уже в очереди ym', () => {
  const env = makeEnv();
  vm.runInContext(snippet, env.ctx);
  assert.equal(env.inserted.length, 0);
  assert.equal(typeof env.window.ym, 'function');
  assert.equal(env.window.ym.a.length, 1);
  assert.equal(env.window.ym.a[0][0], 106173650);
  assert.equal(env.window.ym.a[0][1], 'init');
  assert.ok(env.listeners.load && env.listeners.load.opts && env.listeners.load.opts.once, 'ждёт load один раз');
});

check('после load — ждёт паузу браузера (requestIdleCallback, timeout 3 с), затем вставляет tag.js один раз', () => {
  const env = makeEnv();
  vm.runInContext(snippet, env.ctx);
  env.listeners.load.fn();
  assert.equal(env.inserted.length, 0, 'не сразу после load');
  assert.equal(env.idleQueue.length, 1);
  assert.equal(env.idleQueue[0].opts.timeout, 3000);
  env.idleQueue[0].fn();
  assert.equal(env.inserted.length, 1);
  assert.equal(env.inserted[0].src, TAG);
  assert.equal(env.inserted[0].async, 1);
});

check('страница уже загружена (переход по сайту) — сразу в очередь паузы, без ожидания load', () => {
  const env = makeEnv({ readyState: 'complete' });
  vm.runInContext(snippet, env.ctx);
  assert.equal(env.listeners.load, undefined);
  assert.equal(env.idleQueue.length, 1);
  env.idleQueue[0].fn();
  assert.equal(env.inserted.length, 1);
});

check('без requestIdleCallback (Safari) — через 1,5 с после load', () => {
  const env = makeEnv({ idle: false });
  vm.runInContext(snippet, env.ctx);
  env.listeners.load.fn();
  assert.equal(env.timers.length, 1);
  assert.equal(env.timers[0].ms, 1500);
  env.timers[0].fn();
  assert.equal(env.inserted.length, 1);
});

check('tag.js уже на странице — второй раз не вставляется', () => {
  const env = makeEnv({ readyState: 'complete', existing: true });
  vm.runInContext(snippet, env.ctx);
  env.idleQueue[0].fn();
  assert.equal(env.inserted.length, 0);
});

check('параметры счётчика прежние (вебвизор, карта кликов, ссылки, отказы, ecommerce, ssr)', () => {
  for (const p of ['ssr:true', 'webvisor:true', 'clickmap:true', 'ecommerce:"dataLayer"', 'accurateTrackBounce:true', 'trackLinks:true']) {
    assert.ok(snippet.includes(p), p);
  }
  assert.match(app, /src="https:\/\/mc\.yandex\.ru\/watch\/106173650"/, 'noscript-пиксель на месте');
});

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed ? 1 : 0);
