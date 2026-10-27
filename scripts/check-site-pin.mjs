// Проверка: на сайте нет кода доступа (PIN) — сайт открывается сразу (решение владельца 27.10.2026;
// раньше окно с кодом 1289, до 08.10 — 2103). Запуск: node scripts/check-site-pin.mjs (без npm install).
// Код из письма при входе (components/auth/verification) — не PIN, остаётся.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (rel) => fs.readFileSync(path.join(root, rel), 'utf8');
const exists = (rel) => fs.existsSync(path.join(root, rel));
const code = (s) => s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:])\/\/.*$/gm, '$1');

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

function sources(dir) {
  const out = [];
  for (const entry of fs.readdirSync(path.join(root, dir), { withFileTypes: true })) {
    const rel = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...sources(rel));
    else if (/\.(tsx?|jsx?)$/.test(entry.name)) out.push(rel);
  }
  return out;
}
const files = sources('src').map((rel) => ({ rel, text: code(read(rel)) }));
const offenders = (re) => files.filter((f) => re.test(f.text)).map((f) => f.rel);

console.log('Кода доступа к сайту нет');

check('окна кода нет: UI/modalPin удалён, никто его не подключает', () => {
  assert.ok(!exists('src/components/UI/modalPin'), 'папка src/components/UI/modalPin');
  assert.deepEqual(offenders(/ModalPin|UI\/modalPin/), []);
});

check('нет кода и флага «код введён»: PIN = …, pin_code, PIN_ACCESS_VALUE, getPin / savePin', () => {
  assert.deepEqual(offenders(/\bPIN\s*=\s*['"]?\d{4}/), []);
  assert.deepEqual(offenders(/['"]pin_code['"]/), []);
  assert.deepEqual(offenders(/PIN_ACCESS_VALUE|\bgetPin\b|\bsavePin\b/), []);
});

check('нижнее меню на месте и без окна кода', () => {
  assert.match(code(read('src/pages/_app.tsx')), /<MobileBottomBar\s*\/>/);
  const bar = code(read('src/components/mobileBottomBar/index.tsx'));
  assert.ok(!/pinModalOpen|setPinModalOpen/.test(bar));
  assert.match(bar, /<AuthModal open=\{authModalOpen\} setOpen=\{setAuthModalOpen\}\/>/);
});

check('вход по коду из письма не тронут (это не PIN)', () => {
  assert.ok(exists('src/components/UI/verificationCodeInput/index.tsx'));
  assert.ok(exists('src/components/auth/verification.tsx'));
  assert.match(code(read('src/utils/auth.tsx')), /export const clearSession = \(\) => \{\s*deleteToken\(\);\s*\};/);
});

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed ? 1 : 0);
