// Страница /pay (возврат из банка после оплаты): кнопки ведут на сайте в профиль и на главную.
// Раньше «Перейти в профиль» только слала сообщение в WebView приложения, а в браузере
// (куда банк возвращает и с сайта, и из приложения) ничего не происходило.
// Запуск: node scripts/check-pay-profile.mjs
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (rel) => readFileSync(path.join(root, rel), 'utf8');

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

const pay = read('src/pages/pay/index.tsx');

console.log('Оплата: возврат на сайт и переход в профиль');

check('обработчик кнопок переходит по адресу через router.push', () => {
  assert.match(pay, /const SendModalMessage = \(href: string\)=>\{[\s\S]*?void router\.push\(href\);\s*\}/);
});

check('«Перейти в профиль» ведёт на /profile', () => {
  assert.match(pay, /title=\{'Перейти в профиль'\} onClick=\{\(\)=>SendModalMessage\('\/profile'\)\}/);
});

check('«Перейти на главную» ведёт на /', () => {
  assert.match(pay, /title=\{'Перейти на главную'\} onClick=\{\(\)=>SendModalMessage\('\/'\)\}/);
});

check('сообщение в WebView приложения осталось и шлётся только при наличии WebView', () => {
  assert.match(pay, /if \(window\.ReactNativeWebView && window\.ReactNativeWebView\.postMessage\) \{\s*window\.ReactNativeWebView\.postMessage\(\{status:status\}\);\s*\}/);
});

check('тексты страницы без изменений', () => {
  for (const t of ['Спасибо за ваш заказ', 'Платёж успешно выполнен', 'Оплата не завершена', 'Перейти в профиль', 'Перейти на главную']) {
    assert.ok(pay.includes(t), t);
  }
});

check('внутренний заказ: экран «Оплата прошла» со ссылками на заказ и главную не тронут', () => {
  const s = read('src/components/totusBooking/TotusBookingSuccess.tsx');
  assert.match(s, /const orderHref = `\/profile\/my-orders\/\$\{encodeURIComponent\(orderId\)\}`;/);
  assert.match(s, /<Link href=\{orderHref\}/);
});

check('профиль закрыт входом: без токена withAuth ведёт на главную (не пустая страница)', () => {
  assert.match(read('src/pages/profile/index.tsx'), /export default withAuth\(Profile\);/);
  assert.match(read('src/utils/withAuth.tsx'), /router\.replace\('\/'\)/);
});

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed ? 1 : 0);
