// Проверка: при первом открытии сайта — окно с кодом доступа 1289 (с 08.10.2026; 07.10 возвращено
// окно с кодом 2103, убранное в totus_WEB #17). Запуск: node scripts/check-site-pin.mjs (без npm install).
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
check('окно кода показывается на каждой странице (MobileBottomBar в _app), если код ещё не вводили', () => {
  assert.match(app, /<MobileBottomBar\s*\/>/);
  assert.match(bar, /import ModalPin from "@\/components\/UI\/modalPin";/);
  // 07.10: начальное false, открывает эффект — у вернувшихся окно не мигает на первом кадре
  assert.match(bar, /const \[pinModalOpen, setPinModalOpen\] = useState\(false\);/);
  assert.match(bar, /\}else\{\s*setPinModalOpen\(true\);/);
  assert.match(bar, /<ModalPin open=\{pinModalOpen\} setOpen=\{setPinModalOpen\}\/>/);
});
check('код 1289; верный код запоминается, окно закрывается', () => {
  assert.match(modal, /const PIN = 1289$/m);
  assert.ok(!/2103/.test(modal), 'прежний код не принимается');
  assert.match(modal, /if\(\+code === \+PIN\)\{\s*savePin\(\)/);
  assert.match(auth, /export const PIN_ACCESS_VALUE = 'v2-1289';/);
  assert.match(auth, /localStorage\.setItem\('pin_code', PIN_ACCESS_VALUE\)/);
});
check('после верного кода окно больше не показывается; вводившим прежний код (YES) — спросить заново', () => {
  assert.match(bar, /import \{getPin, PIN_ACCESS_VALUE\} from "@\/utils\/auth";/);
  assert.match(bar, /const checkPin = getPin\(\)\s*if\(checkPin === PIN_ACCESS_VALUE\)\{\s*setPinModalOpen\(false\);/);
  assert.ok(!/'YES'/.test(bar));
});
check('выход из аккаунта код не сбрасывает', () => {
  assert.match(auth, /export const clearSession = \(\) => \{\s*deleteToken\(\);\s*\};/);
});

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed ? 1 : 0);
