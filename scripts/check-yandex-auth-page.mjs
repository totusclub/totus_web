// Проверка страницы /auth/yandex (вход через Яндекс ID) на чистом Node ≥ 22.18, без npm install:
//   node scripts/check-yandex-auth-page.mjs
// Поломки 01.10: (1) «Войти как…» на странице Яндекса, открытой дольше срока state, давало голый JSON
// yandex_state_invalid — теперь сервер возвращает сюда с error=yandex_state_expired / yandex_state_invalid;
// (2) зависший POST /exchange без тайм-аута держал «Завершаем вход…» бесконечно.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const read = (rel) => readFileSync(join(root, rel), 'utf8');

const errors = await import(join(root, 'src/utils/yandexAuthErrors.ts'));
let passed = 0;
const check = (name, fn) => {
    fn();
    passed += 1;
    console.log(`ok - ${name}`);
};

// Все коды, которыми сервер (totus_API controllers/yandexAuth.controller.js) и обмен ticket
// возвращают на страницу, имеют свой понятный текст, а не общий.
const SERVER_CODES = [
    'yandex_email_required',
    'yandex_access_denied',
    'ticket_invalid',
    'yandex_state_expired',
    'yandex_state_invalid',
    'yandex_timeout',
];
check('у каждого кода сервера свой текст', () => {
    for (const code of SERVER_CODES) {
        const text = errors.yandexAuthErrorText(code);
        assert.notDeepEqual(text, errors.YANDEX_AUTH_DEFAULT_ERROR, code);
        assert.ok(text.title && text.text, code);
    }
});

check('неизвестный код → общий текст', () => {
    assert.deepEqual(errors.yandexAuthErrorText('yandex_failed'), errors.YANDEX_AUTH_DEFAULT_ERROR);
    assert.deepEqual(errors.yandexAuthErrorText(''), errors.YANDEX_AUTH_DEFAULT_ERROR);
});

check('код ошибки обмена: ответ сервера важнее', () => {
    assert.equal(errors.yandexExchangeErrorCode({ response: { data: { error: 'ticket_invalid' } } }), 'ticket_invalid');
});

check('код ошибки обмена: тайм-аут axios → yandex_timeout', () => {
    assert.equal(errors.yandexExchangeErrorCode({ code: 'ECONNABORTED', message: 'timeout of 20000ms exceeded' }), 'yandex_timeout');
    assert.equal(errors.yandexExchangeErrorCode({ code: 'ETIMEDOUT' }), 'yandex_timeout');
});

check('код ошибки обмена: прочий сбой сети → yandex_failed', () => {
    assert.equal(errors.yandexExchangeErrorCode({ code: 'ERR_NETWORK', message: 'Network Error' }), 'yandex_failed');
    assert.equal(errors.yandexExchangeErrorCode(undefined), 'yandex_failed');
});

check('обмен ticket идёт с тайм-аутом', () => {
    assert.ok(errors.YANDEX_EXCHANGE_TIMEOUT_MS > 0 && errors.YANDEX_EXCHANGE_TIMEOUT_MS <= 30000);
    const api = read('src/api/YandexAuthApi.ts');
    const fn = api.slice(api.indexOf('export async function yandexExchange'), api.indexOf('export async function updateProfilePhone'));
    assert.match(fn, /timeout:\s*YANDEX_EXCHANGE_TIMEOUT_MS/);
});

check('страница берёт тексты и код ошибки из общего модуля', () => {
    const page = read('src/pages/auth/yandex.tsx');
    assert.match(page, /yandexExchangeErrorCode\(error\)/);
    assert.match(page, /yandexAuthErrorText\(errorCode\)/);
    assert.doesNotMatch(page, /const ERROR_TEXT/);
});

console.log(`\n${passed} checks passed`);
