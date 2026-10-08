// Звонок в поддержку: закрытие вкладки/страницы во время звонка корректно завершает звонок на сервере.
// Запуск: node scripts/check-call-page-exit.mjs (без npm install).
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

const lib = code(read('src/lib/supportCall.ts'));
const api = code(read('src/api/supportCallApi.ts'));
const css = read('src/components/support/supportCall.module.css');

console.log('Звонок: закрытие страницы');

check('API: end/reject умеют keepalive (запрос доходит после закрытия вкладки)', () => {
  assert.match(api, /export async function endCallRequest\(callId: string, deviceId: string, options: ExitOptions = \{\}\)/);
  assert.match(api, /export async function rejectCallRequest\(callId: string, deviceId: string, options: ExitOptions = \{\}\)/);
  assert.equal((api.match(/keepalive: options\.keepalive === true,/g) || []).length, 2);
});

check('pagehide во время звонка: исходящий/разговор → /end, входящий без ответа → /reject; локально всё закрывается', () => {
  assert.match(lib, /window\.addEventListener\('pagehide', endCallOnPageExit\);/);
  assert.match(lib, /if \(pageExitBound \|\| typeof window === 'undefined'\) return;/);
  assert.match(lib, /registerDevice\(currentDeviceId, loyaltyId\)\.catch\(\(\) => undefined\);\s*bindPageExit\(\);/);
  assert.match(lib, /if \(state !== 'calling' && state !== 'ringing' && state !== 'answered'\) return;/);
  assert.match(lib, /const send = state === 'ringing' \? rejectCallRequest : endCallRequest;\s*send\(callId, deviceId, \{ keepalive: true \}\)\.catch\(\(\) => undefined\);/);
  assert.match(lib, /setState\(state === 'ringing' \? 'rejected' : 'ended'\);\s*teardown\(\{ notifyBackend: false \}\);/);
});

check('свёрнутая плашка: кнопка сброса нажимается (над невидимой «Развернуть»)', () => {
  assert.match(css, /\.miniHangUp \{[^}]*position: relative;[^}]*z-index: 1;/);
});

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed ? 1 : 0);
