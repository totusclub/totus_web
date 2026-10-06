// Проверка: «Мои заказы» в профиле открываются быстро (лёгкий список), без повторного запроса
// и без ложного «Заказов пока нет». Запуск: node scripts/check-profile-orders.mjs (без npm install).
//
// Владелец 06.10.2026: страница профиля долго грузится. Причина — GET /user/orders отдавал по
// каждому заказу весь пакет Level.Travel (мегабайты); эффект зависел от объекта user, который
// _app / useAuth пересоздают (setAuth), — запрос уходил дважды; ошибка показывалась как «Заказов пока нет».

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

const api = code(read('src/api/ordersList.ts'));
const list = code(read('src/components/profile/orderList.tsx'));
const details = code(read('src/pages/profile/my-orders/[order_id].tsx'));

console.log('Профиль: «Мои заказы»');

check('список — GET /user/orders?view=list (только поля карточек)', () => {
  assert.match(api, /\/user\/orders`/);
  assert.match(api, /params: \{ user_id: userId, view: 'list' \}/);
  assert.match(list, /import \{ getOrdersList \} from '@\/api\/ordersList';/);
  assert.ok(!/getOrdersUsers/.test(list), 'полный ответ для списка больше не запрашивается');
});

check('страница заказа по-прежнему берёт полный заказ (GET /orders)', () => {
  assert.match(details, /getOrder\(order_id as string\)/);
});

check('один запрос: эффект зависит от id пользователя, а не от объекта user', () => {
  assert.match(list, /\}, \[userId, load\]\);/);
  assert.ok(!/\}, \[user\]\);/.test(list));
  assert.match(list, /const seq = \+\+requestSeq\.current;/);
  assert.match(list, /if \(seq !== requestSeq\.current\) return;/);
});

check('повторное открытие — сразу последний список (память / sessionStorage), обновление в фоне', () => {
  assert.match(list, /const cached = readCachedOrders\(id\);/);
  assert.match(list, /if \(cached\) \{\s*setOrders\(cached\);\s*setLoading\(false\);/);
  assert.match(list, /writeCachedOrders\(id, next\);/);
  assert.match(list, /window\.sessionStorage/);
  assert.ok(!/localStorage/.test(list), 'не храним заказы дольше вкладки');
  assert.match(list, /saved\.userId !== userId/, 'чужой аккаунт не видит');
  assert.match(list, /addEventListener\(AUTH_LOGOUT_EVENT, clearCachedOrders\)/, 'выход стирает');
  assert.match(list, /ORDERS_CACHE_MAX_CHARS = 400000/);
});

check('ошибка не превращается в «Заказов пока нет» и не стирает показанный список', () => {
  assert.match(list, /if \(!cached\) setFailed\(true\);/);
  assert.ok(!/setOrders\(\[\]\)/.test(list));
  assert.match(list, /Не удалось загрузить заказы\./);
  assert.match(list, /Повторить/);
  assert.match(list, /Заказов пока нет/);
  assert.match(list, /Найдено \{orders\.length\} заказов/);
});

check('карточка и скелетон без изменений', () => {
  assert.match(list, /<OrderItem key=\{item\?\.order_id \?\? item\?\.id\} item=\{item\} \/>/);
  assert.match(list, /export \{ OrderListSkeleton, OrderItemSkeleton \};/);
});

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed ? 1 : 0);
