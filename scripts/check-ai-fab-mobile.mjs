// Кнопка Милы (AI) в мобильной версии: над нижним меню, не перекрывает его и поле ввода чата поддержки.
// На компьютере (> 1024px) — без изменений (как в пакете: 20px от низа и справа).
// Запуск: node scripts/check-ai-fab-mobile.mjs (без npm install).
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (rel) => fs.readFileSync(path.join(root, rel), 'utf8');
const noComments = (s) => s.replace(/\/\*[\s\S]*?\*\//g, '');

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

const tsx = read('src/components/GlobalAiChat.tsx');
const css = noComments(read('src/components/globalAiChat.module.css'));
const bar = noComments(read('src/components/mobileBottomBar/mobileBottomBar.module.css'));
const call = noComments(read('src/components/support/supportCall.module.css'));

/** Тело блока @media (...) — по балансу скобок. */
function media(src, query) {
  const i = src.indexOf(`@media ${query}`);
  if (i < 0) return null;
  let depth = 0;
  for (let j = src.indexOf('{', i); j < src.length; j++) {
    if (src[j] === '{') depth++;
    else if (src[j] === '}' && --depth === 0) return src.slice(src.indexOf('{', i) + 1, j);
  }
  return null;
}

console.log('Мила: кнопка в мобильной версии');

check('ChatWidget обёрнут в div со стилем модуля (корень пакета не меняется)', () => {
  assert.match(tsx, /import styles from '\.\/globalAiChat\.module\.css'/);
  assert.match(tsx, /<div className=\{[^\n]*styles\.root\}>\s*<ChatWidget \/>\s*<\/div>/);
});

check('правила только для ширины до 1024px — на компьютере кнопка как в пакете', () => {
  const outside = css.replace(/@media \(max-width: 1024px\) \{[\s\S]*\}\s*$/, '').trim();
  assert.equal(outside, '', 'вне @media (max-width: 1024px) правил нет');
  assert.ok(media(css, '(max-width: 1024px)'));
});

check('нижнее меню по-прежнему 60px, fixed снизу, на ширине до 1024px', () => {
  const m = media(bar, '(max-width: 1024px)');
  assert.ok(m, '@media (max-width: 1024px) в mobileBottomBar');
  assert.match(m, /\.mobileTab\s*\{[^}]*height: 60px;[^}]*position: fixed;[^}]*bottom: 0;/);
});

check('кнопка поднята над меню: bottom 80px = 60px меню + 20px (как отступ на компьютере)', () => {
  const m = media(css, '(max-width: 1024px)');
  assert.match(m, /\.root :global\(\.fixed\.bottom-5\.right-5\) \{\s*bottom: 80px;\s*\}/);
});

check('открытое окно чата помещается между шапкой (56px) и кнопкой', () => {
  const m = media(css, '(max-width: 1024px)');
  assert.match(m, /\.root :global\(\.fixed\.bottom-5\.right-5\) > :not\(button\) \{[^}]*max-height: calc\(100dvh - 216px\);/);
});

check('в полноэкранном чате с поддержкой на телефоне кнопка Милы скрыта (не закрывает «Отправить»)', () => {
  assert.match(tsx, /const HIDE_ON_MOBILE_PATHS = \['\/profile\/support-chat'\]/);
  assert.match(tsx, /HIDE_ON_MOBILE_PATHS\.includes\(pathname\) \? `\$\{styles\.root\} \$\{styles\.hideOnMobile\}` : styles\.root/);
  assert.match(media(css, '(max-width: 1024px)'), /\.hideOnMobile \{\s*display: none;\s*\}/);
});

check('свёрнутый звонок рядом с кнопкой и над меню: bottom 76px на ширине до 1024px и до 480px', () => {
  assert.match(media(call, '(max-width: 1024px)'), /\.miniBar \{\s*bottom: 76px;\s*\}/);
  assert.match(media(call, '(max-width: 480px)'), /\.miniBar \{[^}]*bottom: 76px;/);
  // на компьютере — как было
  assert.match(call.slice(0, call.indexOf('@media')), /\.miniBar \{[^}]*right: 88px;[^}]*bottom: 16px;/);
});

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed ? 1 : 0);
