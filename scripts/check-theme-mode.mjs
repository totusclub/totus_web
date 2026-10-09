// Тема оформления: «Светлая / Тёмная / Системная», по умолчанию — Системная; выбор только в профиле.
// Запуск: node scripts/check-theme-mode.mjs (без npm install).
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (rel) => fs.readFileSync(path.join(root, rel), 'utf8');
const code = (s) => s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:])\/\/.*$/gm, '$1');

let passed = 0;
let failed = 0;
async function check(name, fn) {
  try {
    await fn();
    passed++;
    console.log(`  ok   ${name}`);
  } catch (e) {
    failed++;
    console.log(`  FAIL ${name}\n       ${e && e.message ? e.message : e}`);
  }
}

// src/utils/theme.ts без аннотаций типов → модуль JS (логика проверяется по-настоящему)
const js = read('src/utils/theme.ts')
  .replace(/export type [^;]+;\n/g, '')
  .replace(/: Record<ResolvedTheme, string>/g, '')
  .replace(/\(value: unknown\): ThemeMode/, '(value)')
  .replace(/\(mode: ThemeMode, systemDark: boolean\): ResolvedTheme/, '(mode, systemDark)')
  .replace(/let mode: ThemeMode/, 'let mode')
  .replace(/let resolved: ResolvedTheme/, 'let resolved')
  .replace(/new Set<\(\) => void>\(\)/, 'new Set()')
  .replace(/\(\): boolean/g, '()')
  .replace(/\(\): ThemeMode/g, '()')
  .replace(/\(\): string/g, '()')
  .replace(/\(next: ThemeMode\)/, '(next)')
  .replace(/\(listener: \(\) => void\)/, '(listener)');
const mod = await import('data:text/javascript;base64,' + Buffer.from(js).toString('base64'));

// Браузер-заглушка: localStorage, matchMedia (тема устройства), <html>, <meta name="theme-color">
function fakeBrowser({ stored = {}, systemDark = false } = {}) {
  const store = { ...stored };
  const attrs = {};
  const mqListeners = [];
  const meta = { content: '#ffffff', setAttribute(k, v) { if (k === 'content') this.content = v; } };
  const win = {
    localStorage: {
      getItem: (k) => (k in store ? store[k] : null),
      setItem: (k, v) => { store[k] = String(v); },
      removeItem: (k) => { delete store[k]; },
    },
    matchMedia: (q) => ({
      get matches() { return q === '(prefers-color-scheme: dark)' && win.__dark; },
      addEventListener: (_e, fn) => mqListeners.push(fn),
    }),
    addEventListener: () => {},
    __dark: systemDark,
  };
  const doc = {
    documentElement: { setAttribute: (k, v) => { attrs[k] = v; }, style: {} },
    querySelector: (sel) => (sel === 'meta[name="theme-color"]' ? meta : null),
  };
  const setSystemDark = (v) => { win.__dark = v; mqListeners.forEach((fn) => fn()); };
  return { win, doc, store, attrs, meta, setSystemDark };
}

function runInitScript(env) {
  vm.runInNewContext(mod.THEME_INIT_SCRIPT, { localStorage: env.win.localStorage, window: env.win, document: env.doc });
  return env.attrs['data-theme'];
}

console.log('Тема оформления: Светлая / Тёмная / Системная');

await check('выбор: только light/dark, всё остальное (нет значения, старое, мусор) — Системная', () => {
  assert.equal(mod.parseThemeMode('light'), 'light');
  assert.equal(mod.parseThemeMode('dark'), 'dark');
  for (const v of [null, undefined, '', 'system', 'auto', 'DARK', 1]) assert.equal(mod.parseThemeMode(v), 'system');
  assert.equal(mod.resolveTheme('system', true), 'dark');
  assert.equal(mod.resolveTheme('system', false), 'light');
  assert.equal(mod.resolveTheme('light', true), 'light');
  assert.equal(mod.resolveTheme('dark', false), 'dark');
  assert.equal(mod.THEME_STORAGE_KEY, 'themeMode');
});

await check('скрипт до отрисовки: по умолчанию — тема устройства; ручной выбор сильнее; старый ключ «theme» не учитывается', () => {
  assert.equal(runInitScript(fakeBrowser({ systemDark: true })), 'dark');
  assert.equal(runInitScript(fakeBrowser({ systemDark: false })), 'light');
  assert.equal(runInitScript(fakeBrowser({ systemDark: true, stored: { themeMode: 'light' } })), 'light');
  assert.equal(runInitScript(fakeBrowser({ systemDark: false, stored: { themeMode: 'dark' } })), 'dark');
  assert.equal(runInitScript(fakeBrowser({ systemDark: false, stored: { theme: 'dark' } })), 'light', 'старый переключатель → Системная');
  const env = fakeBrowser({ systemDark: true });
  runInitScript(env);
  assert.equal(env.doc.documentElement.style.colorScheme, 'dark');
  // localStorage недоступен — без ошибки
  const broken = fakeBrowser();
  broken.win.localStorage.getItem = () => { throw new Error('blocked'); };
  assert.doesNotThrow(() => runInitScript(broken));
});

await check('в браузере: Системная следует за устройством на лету; выбор сохраняется; Системная — ключ удаляется', () => {
  const env = fakeBrowser({ systemDark: false, stored: { theme: 'dark' } });
  globalThis.window = env.win;
  globalThis.document = env.doc;
  let notified = 0;
  mod.subscribeTheme(() => { notified++; });
  assert.equal(mod.getThemeSnapshot(), 'system:light');
  assert.ok(!('theme' in env.store), 'старый ключ удалён');
  env.setSystemDark(true);
  assert.equal(mod.getThemeSnapshot(), 'system:dark');
  assert.equal(env.attrs['data-theme'], 'dark');
  assert.equal(env.meta.content, '#141414');
  mod.setThemeMode('light');
  assert.equal(mod.getThemeSnapshot(), 'light:light');
  assert.equal(env.store.themeMode, 'light');
  env.setSystemDark(false);
  env.setSystemDark(true);
  assert.equal(env.attrs['data-theme'], 'light', 'ручной выбор не меняется с устройством');
  mod.setThemeMode('dark');
  assert.equal(env.store.themeMode, 'dark');
  assert.equal(env.doc.documentElement.style.colorScheme, 'dark');
  mod.setThemeMode('system');
  assert.ok(!('themeMode' in env.store), 'Системная = нет значения');
  assert.equal(mod.getThemeSnapshot(), 'system:dark');
  assert.ok(notified >= 4, 'компоненты получают обновление');
  delete globalThis.window;
  delete globalThis.document;
});

await check('_document: скрипт темы первым в <head>; themeInit — общий модуль; хук — один источник для всех компонентов', () => {
  const doc = code(read('src/pages/_document.tsx'));
  assert.match(doc, /import \{ THEME_INIT_SCRIPT \} from '@\/utils\/theme';/);
  assert.match(doc, /<Head>\s*(?:\{\}\s*)?<script dangerouslySetInnerHTML=\{\{ __html: THEME_INIT_SCRIPT \}\} \/>/);
  assert.match(code(read('src/utils/themeInit.ts')), /import \{ initTheme \} from '\.\/theme';\s*initTheme\(\);/);
  assert.match(code(read('src/pages/_app.tsx')), /import '@\/utils\/themeInit';/);
  const hook = code(read('src/hooks/useTheme.ts'));
  assert.match(hook, /useSyncExternalStore\(subscribeTheme, getThemeSnapshot, \(\) => SERVER_THEME_SNAPSHOT\)/);
  assert.ok(!/localStorage/.test(hook), 'хук не хранит тему сам');
  assert.match(hook, /return mounted && theme === 'dark' \? '#fff' : '#000';/);
});

await check('выбор — только в профиле: три кнопки, по умолчанию Системная; переключателя «Темная тема» нет', () => {
  const menu = code(read('src/components/profile/menu.tsx'));
  assert.match(menu, /\{ value: 'light', label: 'Светлая' \},\s*\{ value: 'dark', label: 'Тёмная' \},\s*\{ value: 'system', label: 'Системная' \},/);
  assert.match(menu, /role="radiogroup" aria-label="Тема оформления"/);
  assert.match(menu, /aria-checked=\{active\}/);
  assert.match(menu, /onClick=\{\(\) => setMode\(option\.value\)\}/);
  assert.ok(!/SwitchToggle|Темная тема|toggleTheme/.test(menu));
  const css = read('src/components/profile/profile.module.css');
  assert.match(css, /\.themeSegment \{[^}]*grid-template-columns: repeat\(3, minmax\(0, 1fr\)\);[^}]*background: var\(--bgSecondary\);/);
  assert.match(css, /\.themeSegmentActive,\s*\.themeSegmentActive:hover \{[^}]*background: var\(--bgPrimary\);[^}]*color: var\(--core_Orange\);/);
  for (const f of ['src/components/footer/index.tsx', 'src/components/header/HeaderProfileMenu.tsx', 'src/components/header/index.tsx']) {
    if (fs.existsSync(path.join(root, f))) assert.ok(!/setMode|setThemeMode|themeSegment/.test(read(f)), `нет выбора темы: ${f}`);
  }
});

await check('тёмные иконки не пропадают в тёмной теме: шапка (логотип, назад, поделиться), стрелки слайдеров', () => {
  const header = code(read('src/components/header/index.tsx'));
  assert.equal((header.match(/color=\{iconColor\}/g) || []).length, 3);
  assert.ok(!/color="#000"/.test(header));
  // hotDeals.tsx: стрелок больше нет — на телефоне вместо react-slick прокрутка браузера (scripts/check-mobile-sliders.mjs)
  for (const f of ['src/components/home/tourRecomend.tsx', 'src/components/UI/smallSlide/index.tsx']) {
    const s = code(read(f));
    assert.equal((s.match(/const iconColor = useIconColor\(\);/g) || []).length, 2, f);
    assert.ok(!/name="(right|left)Arrow" size=\{24\} color="#000"/.test(s), f);
  }
});

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed ? 1 : 0);
