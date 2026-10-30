// Calling и Мила на сайте — как в приложении: переключатель «Доступ» в Calling Admin (users.access).
// «Доступ» — в профиле «Чат с поддержкой» и «Звонок в поддержку», Мила; «Заблок.» — ничего из этого.
// Запуск: node scripts/check-calling-access.mjs (без npm install).
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

const api = code(read('src/api/supportCallApi.ts'));
const provider = code(read('src/components/support/SupportCallProvider.tsx'));
const mila = code(read('src/components/GlobalAiChat.tsx'));
const menu = code(read('src/components/profile/menu.tsx'));
const header = code(read('src/components/header/HeaderProfileMenu.tsx'));
const app = code(read('src/pages/_app.tsx'));

/** Выполнить однострочную стрелочную функцию / функцию из TS-исходника (без типов). */
function evalFn(src, re, name) {
  const m = src.match(re);
  assert.ok(m, `нет ${name}`);
  const js = m[0]
    .replace(/^export /, '')
    .replace(/\(([a-z]+): [A-Za-z]+\)/, '($1)')
    .replace(/\): boolean \{/, ') {');
  return new Function(`${js}; return ${name};`)();
}

console.log('Calling и Мила: доступ из Calling Admin');

check('ответ /api/users/by-id разбирается правильно: access лежит в user', () => {
  assert.match(api, /const data = await request<\{ user\?: VoipUserProfile \| null \}>\(\s*`\/api\/users\/by-id\/\$\{encodeURIComponent\(String\(userId\)\)\}`,?\s*\);\s*return data\?\.user \?\? null;/);
});

check('доступ — как в приложении: access 0 или false («Доступ»); true, 1, пусто — нет', () => {
  const has = evalFn(api, /export function hasCallingAccess\(access: unknown\): boolean \{[^}]*\}/, 'hasCallingAccess');
  // calling_api_v2 GET /api/users/by-id: access = (users.access ?? 1) === 1
  assert.equal(has(false), true, 'users.access = 0 → false → «Доступ»');
  assert.equal(has(0), true);
  assert.equal(has(true), false, 'users.access = 1 или пусто → true → «Заблок.»');
  assert.equal(has(1), false);
  assert.equal(has(undefined), false);
  assert.equal(has(null), false);
});

check('Calling — только при «Доступ»; Мила — при «Доступ» и когда профиль не получен (как вкладка Totus AI)', () => {
  const calling = evalFn(provider, /export const isCallingVisible = \(state: CallingAccessState\) => [^;]+;/, 'isCallingVisible');
  const milaVis = evalFn(provider, /export const isMilaVisible = \(state: CallingAccessState\) => [^;]+;/, 'isMilaVisible');
  const table = { none: [false, false], loading: [false, false], allowed: [true, true], denied: [false, false], unknown: [false, true] };
  for (const [state, [c, m]] of Object.entries(table)) {
    assert.equal(calling(state), c, `Calling при ${state}`);
    assert.equal(milaVis(state), m, `Мила при ${state}`);
  }
  assert.match(provider, /setAccessState\(!profile \? 'unknown' : hasCallingAccess\(profile\.access\) \? 'allowed' : 'denied'\);/);
  assert.match(provider, /\}, \[userId\]\);/, 'доступ запрашивается один раз на пользователя');
});

check('звонок запускается только при «Доступ», иначе сервис останавливается', () => {
  assert.match(provider, /if \(accessState !== 'allowed' \|\| !loyaltyId\) \{\s*setAvailable\(false\);/);
  assert.match(provider, /\}, \[accessState, loyaltyId\]\);/);
});

check('Мила скрыта без доступа', () => {
  assert.match(mila, /const \{ milaAllowed \} = useSupportCall\(\)/);
  assert.match(mila, /if \(!milaAllowed\) return null/);
});

check('профиль: «Чат с поддержкой» и «Звонок в поддержку» — только при «Доступ»', () => {
  assert.match(menu, /const \{ available: canCallSupport, call: callSupport, callingAllowed \} = useSupportCall\(\);/);
  assert.match(menu, /\{callingAllowed && \(\s*<div\s*onClick=\{\(\) => router\.push\('\/profile\/support-chat'\)\}/);
  assert.match(menu, /\{canCallSupport && \(/);
});

check('меню в шапке: «Чат с поддержкой» и точка непрочитанных — только при «Доступ»', () => {
  assert.match(header, /const items = allItems\.filter\(\(item\) => item\.id !== 'support' \|\| callingAllowed\);/);
  assert.match(header, /\{callingAllowed && supportUnread > 0 \? <span className=\{styles\.profileAvatarBadge\} \/> : null\}/);
});

check('сокет и счётчик чата поддержки — только при «Доступ»', () => {
  assert.match(app, /import SupportCallProvider, \{ CallingOnly \} from '@\/components\/support\/SupportCallProvider';/);
  assert.match(app, /<CallingOnly>\s*<SupportChatGate \/>\s*<\/CallingOnly>/);
  assert.match(provider, /return callingAllowed \? <>\{children\}<\/> : null;/);
});

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed ? 1 : 0);
