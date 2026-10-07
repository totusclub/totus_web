// Скорость сайта, этап B: тяжёлый код не попадает в общий бандл каждой страницы (_app).
// Статическая проверка исходников. Запуск: node scripts/check-bundle-split.mjs (без npm install).
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

const app = code(read('src/pages/_app.tsx'));
const header = code(read('src/components/header/index.tsx'));
const bar = code(read('src/components/mobileBottomBar/index.tsx'));
const lazyAuth = code(read('src/components/auth/LazyAuthModal.tsx'));
const authOnly = code(read('src/components/AuthOnly.tsx'));
const call = code(read('src/components/support/SupportCallProvider.tsx'));
const icon = code(read('src/components/icons/Icon.tsx'));

console.log('Бандл: общий код страниц');

check('_app: Мила, сокет поддержки и уведомления — dynamic, только после входа', () => {
  for (const [name, mod] of [
    ['GlobalAiChat', '@/components/GlobalAiChat'],
    ['SupportChatGate', '@/components/support/SupportChatGate'],
    ['NotificationsBridge', '@/components/notifications/NotificationsBridge'],
  ]) {
    assert.ok(!new RegExp(`import ${name} from`).test(app), `${name} не импортируется статически`);
    assert.match(app, new RegExp(`const ${name} = dynamic\\(\\(\\) => import\\('${mod.replace(/\//g, '\\/')}'\\), \\{ ssr: false \\}\\);`));
  }
  const inner = app.slice(app.indexOf('<AuthOnly>'), app.indexOf('</AuthOnly>'));
  for (const tag of ['<GlobalAiChat />', '<SupportChatGate />', '<NotificationsBridge />']) assert.ok(inner.includes(tag), tag);
  assert.match(app, /<SupportCallProvider>/, 'провайдер звонка остаётся (контекст для меню профиля)');
});

check('AuthOnly: монтирует после первого входа и не размонтирует при выходе (сброс делают сами компоненты)', () => {
  assert.match(authOnly, /if \(token\) seenRef\.current = true;/);
  assert.match(authOnly, /if \(!seenRef\.current\) return null;/);
  assert.ok(!/seenRef\.current = false/.test(authOnly));
});

check('окно входа: отдельный чанк, монтируется при первом открытии и остаётся; заранее грузится в простое', () => {
  assert.match(lazyAuth, /const AuthModal = dynamic\(\(\) => import\('@\/components\/auth'\), \{ ssr: false \}\);/);
  assert.match(lazyAuth, /if \(!used && !open\) return null;/);
  assert.match(lazyAuth, /if \(open\) setUsed\(true\);/);
  assert.match(lazyAuth, /requestIdleCallback/);
  for (const f of ['src/components/header/index.tsx', 'src/components/mobileBottomBar/index.tsx', 'src/components/ticketItem/index.tsx', 'src/components/hotelDetails/hotelDetailsInfo/index.tsx']) {
    const s = read(f);
    assert.match(s, /import AuthModal from "@\/components\/auth\/LazyAuthModal";/, f);
    assert.ok(!/from "@\/components\/auth";/.test(s), `${f}: прямого импорта нет`);
  }
});

check('шапка: форма поиска — отдельный чанк (с SSR), показывается как раньше на /search и /tickets', () => {
  assert.ok(!/import SearchForm from/.test(header));
  assert.match(header, /const SearchForm = dynamic\(\(\) => import\("@\/components\/search\/searchForm"\)\);/);
  assert.match(header, /if \(pageName === 'search' \|\| pageName === 'tickets'\) \{\s*return <SearchForm pageName=\{pageName\} header=\{true\} \/>/);
});

check('нижнее меню: без неиспользуемого импорта чата поддержки', () => {
  assert.ok(!/import Support from/.test(bar));
});

check('звонок в поддержку: WebRTC и карточка грузятся только при доступе к звонку', () => {
  assert.ok(!/from '@\/lib\/supportCall'/.test(call), 'нет статического импорта lib/supportCall');
  assert.ok(!/import SupportCallModal from/.test(call));
  assert.match(call, /const SupportCallModal = dynamic\(\(\) => import\('\.\/SupportCallModal'\), \{ ssr: false \}\);/);
  assert.match(call, /supportCallModule = import\('@\/lib\/supportCall'\)/);
  assert.match(call, /const supportCall = await loadSupportCall\(\);\s*if \(cancelled\) return;\s*supportCall\.initSupportCall\(loyaltyId\);\s*setAvailable\(true\);/);
  assert.match(call, /if \(supportCallModule\) \{\s*void supportCallModule\.then\(\(m\) => m\.shutdownSupportCall\(\)\)/);
  assert.match(call, /\.then\(\(m\) => m\.callSupport\(\)\)/);
  assert.match(call, /\{available && <SupportCallModal onWriteToChat=\{goToChat\} onRetry=\{call\} \/>\}/);
});

check('иконки: логотипы туроператоров — отдельные чанки, имена в реестре те же', () => {
  for (const n of ['tezTour', 'onexTour', 'funAndSun', 'biblioGlobus', 'pegasTour', 'coralTravel']) {
    assert.ok(!new RegExp(`import ${n} from`).test(icon), n);
    assert.match(icon, new RegExp(`const ${n} = dynamic\\(\\(\\) => import\\("@/components/icons/partner/${n}"\\)\\);`));
    assert.match(icon, new RegExp(`\\b${n}: ${n},`));
  }
});

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed ? 1 : 0);
