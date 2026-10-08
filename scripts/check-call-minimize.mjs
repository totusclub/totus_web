// Звонок в поддержку: «Свернуть» вместо «×», свёрнутая плашка слева от кнопки Милы,
// нажатие на плашку разворачивает, после завершения звонка плашка исчезает.
// Запуск: node scripts/check-call-minimize.mjs (без npm install).
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

const modal = code(read('src/components/support/SupportCallModal.tsx'));
const css = read('src/components/support/supportCall.module.css');
const rule = (sel, media) => {
  const src = media ? css.slice(css.indexOf(media)) : css;
  const m = src.match(new RegExp(`\\${sel} \\{([^}]*)\\}`));
  return m ? m[1] : '';
};

console.log('Звонок: свернуть / развернуть');

check('вместо «×» — кнопка «Свернуть» (стрелка + текст)', () => {
  assert.match(modal, /aria-label="Свернуть звонок"\s+title="Свернуть"\s*>\s*<ChevronDownIcon \/>\s*<span>Свернуть<\/span>/);
  assert.ok(!/>\s*×\s*</.test(modal), 'символа × в карточке нет');
});

check('свёрнутая плашка — слева от кнопки Милы (right 88px = 20 + 56 + 12), и на телефоне', () => {
  assert.match(rule('.miniBar'), /right: 88px;/);
  assert.match(rule('.miniBar'), /bottom: 16px;/);
  assert.match(rule('.miniBar', '@media (max-width: 480px)'), /right: 88px;/);
  assert.match(rule('.miniBar', '@media (max-width: 480px)'), /left: 16px;/);
});

check('нажатие на плашку разворачивает звонок; кнопка сброса не разворачивает', () => {
  assert.match(modal, /className=\{styles\.miniBar\}\s+role="button"\s+tabIndex=\{0\}\s+aria-label="Развернуть звонок"\s+onClick=\{expand\}/);
  assert.match(modal, /const expand = \(\) => setMinimized\(false\);/);
  assert.match(modal, /e\.stopPropagation\(\);\s*if \(isIncoming\) void rejectCall\(\);\s*else endCall\(\);/);
  assert.match(modal, /<span className=\{styles\.miniExpand\} aria-hidden="true">\s*<ChevronUpIcon \/>/);
  assert.match(rule('.miniHangUp'), /z-index: 1;/);
});

check('звонок завершился, пока свёрнут — плашка исчезает сама', () => {
  assert.match(modal, /if \(minimized && \(state === 'ended' \|\| state === 'rejected'\)\) close\(\);/);
  assert.match(modal, /if \(minimized\) \{\s*if \(isFinished\) return null;/);
});

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed ? 1 : 0);
