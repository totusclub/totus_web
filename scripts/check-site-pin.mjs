// Проверка: при первом открытии сайта — окно с кодом доступа 2103 (возвращено 07.10.2026,
// было убрано в totus_WEB #17). Запуск: node scripts/check-site-pin.mjs (без npm install).
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (rel) => fs.readFileSync(path.join(root, rel), 'utf8');
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

const bar = code(read('src/components/mobileBottomBar/index.tsx'));
const modal = code(read('src/components/UI/modalPin/index.tsx'));
const auth = code(read('src/utils/auth.tsx'));
const app = code(read('src/pages/_app.tsx'));

console.log('Код доступа к сайту');
check('окно кода показывается на каждой странице (MobileBottomBar в _app) и открыто до проверки', () => {
  assert.match(app, /<MobileBottomBar\s*\/>/);
  assert.match(bar, /import ModalPin from "@\/components\/UI\/modalPin";/);
  assert.match(bar, /useState\(true\)/);
  assert.match(bar, /<ModalPin open=\{pinModalOpen\} setOpen=\{setPinModalOpen\}\/>/);
});
check('код 2103; верный код запоминается, окно закрывается', () => {
  assert.match(modal, /const PIN = 2103/);
  assert.match(modal, /if\(\+code === \+PIN\)\{\s*savePin\(\)/);
  assert.match(auth, /localStorage\.setItem\('pin_code', 'YES'\)/);
});
check('после верного кода (pin_code = YES) окно больше не показывается', () => {
  assert.match(bar, /const checkPin = getPin\(\)\s*if\(checkPin === 'YES'\)\{\s*setPinModalOpen\(false\);/);
});
check('выход из аккаунта код не сбрасывает', () => {
  assert.match(auth, /export const clearSession = \(\) => \{\s*deleteToken\(\);\s*\};/);
});

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed ? 1 : 0);
