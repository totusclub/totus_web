// Звук входящего звонка и мигание вкладки (src/lib/incomingRingtone.ts + карточка звонка).
// Запуск: node scripts/check-call-ringtone.mjs (без npm install; Node ≥ 22.13 — для проверок поведения).
// Было (до 21.10.2026): входящий звонок оператора появлялся только карточкой — без звука,
// в фоновой вкладке его было не заметить.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import * as nodeModule from 'node:module';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (rel) => fs.readFileSync(path.join(root, rel), 'utf8');
const code = (s) => s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:])\/\/.*$/gm, '$1');

// --- где живут файлы: сайт (totus_WEB) или панель оператора (calling_v2) ---
const exists = (rel) => fs.existsSync(path.join(root, rel));
const RINGTONE = exists('src/lib/incomingRingtone.ts') ? 'src/lib/incomingRingtone.ts' : 'lib/incomingRingtone.ts';
const UI = exists('src/components/support/SupportCallModal.tsx')
  ? 'src/components/support/SupportCallModal.tsx'
  : 'components/IncomingCallRingtone.tsx';

let passed = 0;
let failed = 0;
let skipped = 0;
function check(name, fn) {
  try {
    const r = fn();
    if (r === 'skip') {
      skipped++;
      console.log(`  skip ${name}`);
      return;
    }
    passed++;
    console.log(`  ok   ${name}`);
  } catch (e) {
    failed++;
    console.log(`  FAIL ${name}\n       ${e && e.message ? e.message : e}`);
  }
}

const src = read(RINGTONE);
const ui = code(read(UI));

// --- модуль звонка в песочнице: фальшивые таймеры, document, AudioContext ---
function loadRingtone({ withWindow = true, ctxState = 'running' } = {}) {
  if (typeof nodeModule.stripTypeScriptTypes !== 'function') return null;
  const js = nodeModule
    .stripTypeScriptTypes(src)
    .replace(/export function (\w+)/g, (_, n) => `exports.${n} = ${n}; function ${n}`);

  const timers = [];
  let nextId = 1;
  let now = 0;
  const setIntervalF = (fn, ms) => { const id = nextId++; timers.push({ id, fn, ms, at: now + ms, repeat: true }); return id; };
  const setTimeoutF = (fn, ms) => { const id = nextId++; timers.push({ id, fn, ms, at: now + ms, repeat: false }); return id; };
  const clearF = (id) => { const i = timers.findIndex((t) => t.id === id); if (i >= 0) timers.splice(i, 1); };
  const advance = (ms) => {
    const end = now + ms;
    for (;;) {
      timers.sort((a, b) => a.at - b.at);
      const t = timers[0];
      if (!t || t.at > end) break;
      now = t.at;
      if (t.repeat) t.at += t.ms; else timers.shift();
      t.fn();
    }
    now = end;
  };

  const audio = { created: 0, oscillators: [], resumes: 0, state: ctxState };
  class FakeParam { setValueAtTime() {} linearRampToValueAtTime() {} }
  class FakeCtx {
    constructor() { audio.created++; this.currentTime = 0; this.destination = {}; }
    get state() { return audio.state; }
    resume() { audio.resumes++; audio.state = 'running'; return Promise.resolve(); }
    createGain() { return { gain: new FakeParam(), connect() {}, disconnect() {} }; }
    createOscillator() {
      const o = { type: '', frequency: { value: 0 }, started: false, stopped: false, onended: null,
        connect() {}, start() { this.started = true; }, stop() { this.stopped = true; } };
      audio.oscillators.push(o);
      return o;
    }
  }
  const listeners = {};
  const document = { title: 'Totus Club' };
  const window = withWindow
    ? { AudioContext: FakeCtx, addEventListener: (ev, fn) => { (listeners[ev] ||= []).push(fn); } }
    : undefined;
  const exports = {};
  new Function('exports', 'window', 'document', 'setInterval', 'setTimeout', 'clearInterval', 'clearTimeout', js)(
    exports, window, withWindow ? document : undefined, setIntervalF, setTimeoutF, clearF, clearF,
  );
  return { m: exports, audio, document, listeners, advance, timers };
}

console.log('Звук входящего звонка');

check('синтез в браузере: 440 + 480 Гц, 1,2 с звук / 2 с пауза, без файлов', () => {
  assert.match(src, /const TONE_HZ = \[440, 480\];/);
  assert.match(src, /const RING_ON_MS = 1200;/);
  assert.match(src, /const RING_OFF_MS = 2000;/);
  assert.ok(!/new Audio\(|\.mp3|\.wav|\.ogg/.test(code(src)), 'никаких аудиофайлов');
});

check('звонок: два тона сразу, повтор каждые 3,2 с, повторный start не дублирует', () => {
  const s = loadRingtone();
  if (!s) return 'skip';
  s.m.startIncomingRingtone();
  assert.equal(s.m.isIncomingRingtonePlaying(), true);
  assert.deepEqual(s.audio.oscillators.map((o) => o.frequency.value), [440, 480]);
  s.m.startIncomingRingtone(); // call-state ringing + offer — два события на один звонок
  assert.equal(s.audio.oscillators.length, 2);
  s.advance(3200);
  assert.equal(s.audio.oscillators.length, 4);
  s.advance(3200 * 2);
  assert.equal(s.audio.oscillators.length, 8);
  assert.equal(s.audio.created, 1, 'один AudioContext на страницу');
});

check('ответ / отклонение / отбой: звук и повторы останавливаются', () => {
  const s = loadRingtone();
  if (!s) return 'skip';
  s.m.startIncomingRingtone();
  s.m.stopIncomingRingtone();
  assert.equal(s.m.isIncomingRingtonePlaying(), false);
  assert.ok(s.audio.oscillators.every((o) => o.stopped), 'текущий звук оборван');
  const n = s.audio.oscillators.length;
  s.advance(10_000);
  assert.equal(s.audio.oscillators.length, n, 'новых гудков нет');
  assert.equal(s.timers.length, 0, 'таймеров не осталось');
  s.m.stopIncomingRingtone(); // повторный stop безопасен
});

check('страховка: без отбоя от сервера звук сам замолкает через 65 с', () => {
  const s = loadRingtone();
  if (!s) return 'skip';
  s.m.startIncomingRingtone();
  s.advance(64_000);
  assert.equal(s.m.isIncomingRingtonePlaying(), true);
  s.advance(1_500);
  assert.equal(s.m.isIncomingRingtonePlaying(), false);
  assert.equal(s.document.title, 'Totus Club');
});

check('автовоспроизведение: первое нажатие / клавиша размораживает звук', () => {
  const s = loadRingtone({ ctxState: 'suspended' });
  if (!s) return 'skip';
  s.m.installAudioUnlock();
  s.m.installAudioUnlock(); // второй раз — не дублирует
  for (const ev of ['pointerdown', 'keydown', 'touchend']) assert.equal(s.listeners[ev]?.length, 1, ev);
  s.listeners.pointerdown[0]();
  assert.equal(s.audio.resumes, 1);
  assert.equal(s.audio.state, 'running');
});

check('без window (сервер Next) — ничего не делает и не падает', () => {
  const s = loadRingtone({ withWindow: false });
  if (!s) return 'skip';
  s.m.installAudioUnlock();
  s.m.startIncomingRingtone();
  assert.equal(s.m.isIncomingRingtonePlaying(), false);
  s.m.stopIncomingRingtone();
});

console.log('Мигание вкладки');

check('заголовок мигает «📞 Входящий звонок» раз в секунду и возвращается после звонка', () => {
  const s = loadRingtone();
  if (!s) return 'skip';
  s.m.startIncomingRingtone();
  s.advance(1000);
  assert.equal(s.document.title, '📞 Входящий звонок');
  s.advance(1000);
  assert.equal(s.document.title, 'Totus Club');
  s.advance(1000);
  s.m.stopIncomingRingtone();
  assert.equal(s.document.title, 'Totus Club');
});

check('заголовок сменили во время звонка (счётчик чата) — после звонка остаётся новый', () => {
  const s = loadRingtone();
  if (!s) return 'skip';
  s.m.startIncomingRingtone();
  s.advance(2000); // снова обычный заголовок
  s.document.title = '(2) Totus Web Calling';
  s.advance(1000);
  assert.equal(s.document.title, '📞 Входящий звонок');
  s.m.stopIncomingRingtone();
  assert.equal(s.document.title, '(2) Totus Web Calling');
});

console.log('Подключение к звонку');

check('звонит только в состоянии ringing; любое другое — тишина; ушли со страницы — тишина', () => {
  assert.match(ui, /if \(state === 'ringing'\) startIncomingRingtone\(\);\s*else stopIncomingRingtone\(\);/);
  assert.match(ui, /installAudioUnlock\(\);/);
  assert.match(ui, /return \(\) => (\{[^}]*)?stopIncomingRingtone\(\)/);
});

check('панель оператора: звук на любой странице — компонент в app/layout.tsx', () => {
  if (!exists('app/layout.tsx')) return 'skip';
  const layout = code(read('app/layout.tsx'));
  assert.match(layout, /import IncomingCallRingtone from '@\/components\/IncomingCallRingtone';/);
  assert.match(layout, /<IncomingCallRingtone \/>/);
  assert.match(ui, /setState\(getCallState\(\)\.state\)/);
});

console.log(`\n${passed} passed, ${failed} failed${skipped ? `, ${skipped} skipped` : ''}`);
process.exit(failed ? 1 : 0);
