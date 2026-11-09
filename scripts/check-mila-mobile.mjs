// Маша на телефоне (до 1024px): чат на весь экран — макет «Маша на телефоне», утверждён 09.10.2026.
// Без масштаба страницы (поле 16px), без прокрутки вбок, поле над клавиатурой, «Назад» закрывает чат.
// Компьютер — по-прежнему ChatWidget пакета.
// Запуск: node scripts/check-mila-mobile.mjs (без npm install).
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (rel) => fs.readFileSync(path.join(root, rel), 'utf8');
const noComments = (s) => s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:])\/\/.*$/gm, '$1');

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

const g = noComments(read('src/components/GlobalAiChat.tsx'));
const tsx = noComments(read('src/components/mila/MobileMilaChat.tsx'));
const css = noComments(read('src/components/mila/mobileMilaChat.module.css'));
const rule = (sel) => {
  const m = css.match(new RegExp(`(?:^|\\n)${sel.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')} \\{([^}]*)\\}`));
  return m ? m[1] : '';
};

console.log('Маша на телефоне');

check('до 1024px — MobileMilaChat, на компьютере — ChatWidget пакета, как раньше', () => {
  assert.match(g, /const MOBILE_QUERY = '\(max-width: 1024px\)'/);
  assert.match(g, /\{isMobile \? \(\s*<MobileMilaChat hideFab=\{HIDE_ON_MOBILE_PATHS\.includes\(pathname\)\} \/>\s*\) : \(\s*<div className=\{[^\n]*styles\.root\}>\s*<ChatWidget \/>/);
  assert.match(g, /mq\.addEventListener\('change', update\)/);
});

check('те же данные и сокет, что у ChatWidget: useAssistant / useAssistantStore / ChatMessage пакета', () => {
  assert.match(tsx, /import \{ ChatMessage, MashaFabIcon, useAssistant, useAssistantStore \} from '@tosmedia\/ai-assistant'/);
  assert.equal((tsx.match(/useAssistant\(\)/g) || []).length, 1, 'один useAssistant — одно соединение');
  assert.match(tsx, /window\.addEventListener\('assistant:send', handler\)/);
});

check('чат на весь экран, поверх меню, cookies и поиска', () => {
  const s = rule('.sheet');
  assert.match(s, /position: fixed;/);
  assert.match(s, /left: 0;\s*right: 0;/);
  assert.match(s, /z-index: 100000002;/);
  assert.match(tsx, /role="dialog" aria-modal="true" aria-label="Чат с Машей"/);
});

check('поле ввода над клавиатурой: высота = visualViewport', () => {
  const s = rule('.sheet');
  assert.match(s, /top: var\(--mila-top, 0px\);/);
  assert.match(s, /height: var\(--mila-vh, 100dvh\);/);
  assert.match(tsx, /const vv = window\.visualViewport/);
  assert.match(tsx, /vv\?\.addEventListener\('resize', apply\)/);
  assert.match(tsx, /el\.style\.setProperty\('--mila-vh', `\$\{Math\.round\(height\)\}px`\)/);
});

check('страница не увеличивается: поле 16px; кнопка отправки не закрывает клавиатуру', () => {
  assert.match(rule('.sheet .field'), /font-size: 16px;/);
  assert.match(tsx, /onPointerDown=\{\(e\) => e\.preventDefault\(\)\}/);
  assert.ok(!/onKeyDown/.test(tsx), '«Ввод» переносит строку, отправка — кнопкой');
});

check('без прокрутки вбок: лента режет лишнее, длинные ссылки переносятся', () => {
  assert.match(rule('.sheet .feed'), /overflow-x: hidden;/);
  assert.match(rule('.sheet'), /overflow: hidden;/);
  assert.match(css, /\.sheet \.messages :global\(\.animate-fade-in-up\) > div \{[^}]*font-size: 16px;[^}]*overflow-wrap: anywhere;/);
});

check('страница под чатом не прокручивается и возвращается на место', () => {
  assert.match(tsx, /body\.style\.position = 'fixed'/);
  assert.match(tsx, /body\.style\.top = `-\$\{scrollY\}px`/);
  assert.match(tsx, /window\.scrollTo\(0, scrollY\)/);
});

check('«Назад» закрывает чат, Next.js эту запись истории не обрабатывает', () => {
  assert.match(tsx, /window\.history\.pushState\(\{ \.\.\.window\.history\.state, milaChat: true \}, ''\)/);
  assert.match(tsx, /router\.beforePopState\(\(\) => !historyPushedRef\.current\)/);
  assert.match(tsx, /useAssistantStore\.getState\(\)\.setOpen\(false\)/);
  assert.match(tsx, /window\.history\.back\(\)/);
});

check('кнопки пакет не перебивает (.totus-ai-root button): стили через родителя', () => {
  for (const sel of ['.fabWrap .fab', '.sheet .iconBtn', '.sheet .send', '.sheet .start', '.sheet .chip', '.sheet .newChat']) {
    assert.ok(rule(sel), sel);
  }
  for (const sel of ['.sheet .iconBtn', '.sheet .send']) {
    assert.match(rule(sel), /width: 4[46]px;\s*height: 4[46]px;/, `${sel}: не меньше 44px`);
  }
});

check('кнопка Маши над нижним меню (80px), в чате поддержки скрыта', () => {
  assert.match(rule('.fabWrap'), /right: 20px;\s*bottom: 80px;/);
  assert.match(tsx, /if \(hideFab\) return null/);
});

check('значок кнопки — смена сценариев путешествий из пакета (MashaFabIcon), кнопка — основа для него', () => {
  assert.match(tsx, /<MashaFabIcon \/>/);
  assert.match(rule('.fabWrap .fab'), /position: relative;/);
});

check('первый экран, подсказки после туров, «Мои чаты» со смахиванием', () => {
  for (const t of ['Совет, куда ехать', 'Туры в Турцию', 'Туры в Египет', 'Что такое «ультра всё включено»', 'Дешевле', 'Ближе к морю', 'Другие даты', 'Новый чат', 'Мои чаты', 'Удалить']) {
    assert.ok(tsx.includes(t), t);
  }
  assert.match(tsx, /last\.role === 'assistant' && Boolean\(last\.metadata\?\.tour_results\?\.length\)/);
  assert.match(rule('.sheet .row'), /touch-action: pan-y;/);
});

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed ? 1 : 0);
