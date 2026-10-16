// /booking и /checkout: экраны «тур недоступен» / «не удалось загрузить» с «Повторить» и
// «Выбрать другой перелёт», подсказка при долгой проверке, «тур раскупили» при оформлении,
// «Что входит в тур» и «А что ещё» из данных Level.Travel (макет утверждён 16.10.2026).
// Запуск: node scripts/check-booking-ui.mjs (Node ≥ 22.18, без npm install).
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import module from 'node:module';
import { fileURLToPath, pathToFileURL } from 'node:url';

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

if (!process.features?.typescript || typeof module.registerHooks !== 'function') {
  console.log('SKIP: нужен Node ≥ 22.18 (type stripping + module.registerHooks)');
  process.exit(0);
}

// ---- настоящий src/utils/bookingOffer.ts; axios подменён, @/ → src/ --------------------------
const MOCKS = {
  axios: `
    const isAxiosError = (e) => Boolean(e && e.isAxiosError === true);
    export default { isAxiosError, isCancel: () => false };`,
};
module.registerHooks({
  resolve(specifier, context, next) {
    if (Object.prototype.hasOwnProperty.call(MOCKS, specifier)) return { url: `mock:${specifier}`, shortCircuit: true };
    if (specifier.startsWith('@/')) {
      const base = path.join(root, 'src', specifier.slice(2));
      for (const ext of ['.ts', '.tsx']) {
        if (fs.existsSync(base + ext)) return { url: pathToFileURL(base + ext).href, shortCircuit: true };
      }
    }
    return next(specifier, context);
  },
  load(url, context, next) {
    if (url.startsWith('mock:')) return { format: 'module', source: MOCKS[url.slice(5)], shortCircuit: true };
    if (url.startsWith('file:') && /\.tsx?$/.test(url)) {
      return { format: 'module-typescript', source: fs.readFileSync(fileURLToPath(url), 'utf8'), shortCircuit: true };
    }
    return next(url, context);
  },
});
const offer = await import(pathToFileURL(path.join(root, 'src/utils/bookingOffer.ts')).href);
const axiosErr = (status, data) => ({ isAxiosError: true, response: status ? { status, data } : undefined });

// Живой ответ actualize (тур 409294734, 16.10.2026): протух, но пакет в теле есть.
const ROTTEN = {
  success: false,
  rotten: true,
  exception: 'package is expired',
  package: {
    id: 409294734, adults_count: 2, kids_count: 0, nights_count: 7, transfer: false,
    medical_insurance: true, instant_confirm: false, available: false, extras: [], taxes: [], notices: [],
    pansion_description: 'Ультра всё включено',
    departure: { name_ru: 'Москва', name_ru_form2: 'Москвы' },
    dates_info: { start_date: '2026-10-22', end_date: '2026-10-29', nights_count: 7 },
    hotel: { city: 'Белек', country: 'Турция', visa: { needed: false, type: 'no_visa' } },
  },
};

console.log('Бронирование: состояния страницы и «Что входит в тур»');

await check('недоступный тур и сбой связи различаются: «Повторить» только там, где поможет', () => {
  assert.equal(offer.isOfferUnavailablePayload(ROTTEN), true);
  assert.equal(offer.isOfferUnavailablePayload({ success: true, package: { available: true } }), false);
  assert.equal(offer.classifyBookingLoadFailure(axiosErr(504, { success: false, code: 'lt_timeout' })), 'error');
  assert.equal(offer.classifyBookingLoadFailure(axiosErr(502, { success: false, code: 'lt_unreachable' })), 'error');
  assert.equal(offer.classifyBookingLoadFailure(axiosErr(500, { error: 'Failed to start search' })), 'error');
  assert.equal(offer.classifyBookingLoadFailure(axiosErr(0)), 'error', 'нет ответа (таймаут браузера / сеть)');
  assert.equal(offer.classifyBookingLoadFailure(new Error('x')), 'error');
  assert.equal(offer.classifyBookingLoadFailure(axiosErr(404, { code: 'lt_error', error: 'Package not found' })), 'unavailable');
  assert.equal(offer.classifyBookingLoadFailure(axiosErr(422, { code: 'lt_error' })), 'unavailable');
  assert.equal(offer.classifyBookingLoadFailure(axiosErr(429, {})), 'error');
});

await check('«Выбрать другой перелёт» ведёт на перелёты того же пакета, только с числовым id', () => {
  assert.equal(offer.getOtherFlightHref(409294734), '/tickets?package=409294734');
  assert.equal(offer.getOtherFlightHref(['55']), '/tickets?package=55');
  assert.equal(offer.getOtherFlightHref('javascript:alert(1)'), null);
  assert.equal(offer.getOtherFlightHref(undefined), null);
});

await check('строка тура в «недоступно»: место, даты, люди — из пакета в отказе LT', () => {
  assert.equal(offer.getOfferSummary(ROTTEN.package), 'Белек, Турция · 22–29 октября · 2 взрослых');
  assert.equal(
    offer.formatDateRangeShort('2026-10-30', '2026-11-06'),
    '30 октября – 6 ноября',
  );
  assert.equal(offer.getOfferSummary(null), '');
  assert.equal(offer.formatNights(1), '1 ночь');
  assert.equal(offer.formatNights(3), '3 ночи');
  assert.equal(offer.formatNights(11), '11 ночей');
});

await check('«Что входит в тур» — из полей LT; нет поля — нет строки', () => {
  const items = offer.getBookingInclusions(ROTTEN.package);
  const byKey = Object.fromEntries(items.map((i) => [i.key, i]));
  assert.equal(byKey.flight.title, 'Перелёт из Москвы и обратно');
  assert.equal(byKey.stay.title, 'Проживание, 7 ночей · Ультра всё включено');
  assert.equal(byKey.insurance.kind, 'yes');
  assert.equal(byKey.transfer.kind, 'no');
  assert.equal(byKey.transfer.note, 'не входит');
  assert.equal(byKey.visa.note, 'не нужна');

  const bare = offer.getBookingInclusions({ nights_count: 7 });
  assert.deepEqual(bare.map((i) => i.key), ['flight', 'stay'], 'без transfer / medical_insurance / visa строк нет');

  const withTransfer = offer.getBookingInclusions({ ...ROTTEN.package, transfer: true, medical_insurance: false });
  assert.equal(withTransfer.find((i) => i.key === 'transfer').kind, 'yes');
  assert.equal(withTransfer.find((i) => i.key === 'insurance').kind, 'no');

  const hotel = offer.getBookingInclusions(ROTTEN.package, { isHotelOnly: true });
  assert.ok(!hotel.some((i) => i.key === 'flight' || i.key === 'transfer'), 'у отеля нет перелёта и трансфера');
});

await check('налоги, доп. услуги и уведомления LT попадают в список, длинный текст обрезан', () => {
  const pkg = {
    ...ROTTEN.package,
    hotel: { ...ROTTEN.package.hotel, visa: { needed: true, text: 'Оформляется по прилёту' } },
    taxes: [{ name: 'Туристический налог', price: 1500 }],
    extras: [{ title: 'Трансфер VIP', price: 9000 }, {}],
    notices: ['Обязательна регистрация на рейс онлайн', { text: 'x'.repeat(400) }],
  };
  const items = offer.getBookingInclusions(pkg);
  const visa = items.find((i) => i.key === 'visa');
  assert.equal(visa.note, 'нужна');
  assert.equal(visa.detail, 'Оформляется по прилёту');
  const tax = items.find((i) => i.key === 'tax-0');
  assert.equal(tax.title, 'Туристический налог');
  assert.equal(tax.note, `1${String.fromCharCode(0x202f)}500${String.fromCharCode(0xa0)}₽`);
  assert.equal(items.filter((i) => i.key.startsWith('extra-')).length, 1, 'пустая доп. услуга пропущена');
  assert.equal(items.find((i) => i.key === 'notice-0').title, 'Обязательна регистрация на рейс онлайн');
  assert.ok(items.find((i) => i.key === 'notice-1').title.length <= 240);
});

await check('подпись доплаты и подтверждение — по данным, а не «Быстрое подтверждение» для всех', () => {
  assert.equal(offer.getFeesLabel({ _fees_source: 'flight' }), 'Топливный сбор авиакомпании');
  assert.equal(offer.getFeesLabel({ _fees_source: 'package' }), 'Топливный сбор авиакомпании');
  assert.equal(offer.getFeesLabel({ _fees_source: 'predicted' }), 'Доплаты и сборы');
  assert.equal(offer.getFeesLabel({}), 'Доплаты и сборы');
  assert.equal(offer.getConfirmationLabel({ instant_confirm: true }), 'Мгновенное');
  assert.equal(offer.getConfirmationLabel({ instant_confirm: false }), 'После проверки туроператором');
  assert.equal(offer.getConfirmationLabel({}), null);
});

await check('«Вернуться к номерам»: только свой путь, не /booking и не чужой сайт', () => {
  const store = new Map();
  globalThis.sessionStorage = {
    getItem: (k) => (store.has(k) ? store.get(k) : null),
    setItem: (k, v) => store.set(k, String(v)),
  };
  offer.saveBookingReturnUrl('/hotel-details?hotel_id=9133387&request_id=abc');
  assert.equal(offer.readBookingReturnUrl(), '/hotel-details?hotel_id=9133387&request_id=abc');
  offer.saveBookingReturnUrl('//evil.example/x');
  assert.equal(offer.readBookingReturnUrl(), '/hotel-details?hotel_id=9133387&request_id=abc', '«//» не сохраняется');
  store.set('totus_booking_return_url', '/booking?package=1');
  assert.equal(offer.readBookingReturnUrl(), null);
  globalThis.sessionStorage = { getItem: () => { throw new Error('denied'); }, setItem: () => { throw new Error('denied'); } };
  assert.equal(offer.readBookingReturnUrl(), null);
  offer.saveBookingReturnUrl('/hotel-details?hotel_id=1');
  delete globalThis.sessionStorage;
});

// ---- исходники страниц ----------------------------------------------------------------------
const page = code(read('src/components/bookingPage/index.tsx'));
const card = code(read('src/components/bookingPage/orderCard.tsx'));
const status = code(read('src/components/bookingPage/bookingStatus.tsx'));
const checkout = code(read('src/components/checkoutPage/checkOutItems.tsx'));
const flow = code(read('src/utils/bookingFlowUtils.ts'));

await check('страница: при недоступном туре и сбое — экран вместо вечного скелетона, «Повторить» перезапускает загрузку', () => {
  assert.match(page, /loadState === 'unavailable' \|\| loadState === 'error'/);
  assert.match(page, /<BookingUnavailable/);
  assert.match(page, /<BookingLoadError[\s\S]*?onRetry=\{\(\) => setLoadAttempt\(\(n\) => n \+ 1\)\}/);
  assert.match(page, /loadAttempt,\s*\]\);/, 'loadAttempt в зависимостях эффекта загрузки');
  assert.match(page, /setLoadState\('unavailable'\)/);
  assert.match(page, /const kind = classifyBookingLoadFailure\(err\)[\s\S]*?setLoadState\(kind\)/);
  assert.match(page, /if \(!packageId\) \{[\s\S]*?setLoadState\('unavailable'\)/, 'без ?package= — тоже экран');
  assert.match(page, /setTimeout\(\(\) => setSlowLoading\(true\), BOOKING_SLOW_HINT_MS\)/);
});

await check('оформление: тур раскупили — заказ не создаётся, кнопка выключена, есть переходы', () => {
  const submit = page.slice(page.indexOf('const handleSubmit'));
  const sold = submit.indexOf('setSubmitUnavailable(true)');
  const create = submit.indexOf('await createOrder(');
  assert.ok(sold > 0 && create > sold, 'проверка тура до создания заказа');
  assert.match(submit, /if \(blockReason\) \{[\s\S]*?setSubmitUnavailable\(true\);[\s\S]*?return;/);
  assert.match(card, /disabled=\{!isFormValid \|\| !consentsOk \|\| loading \|\| submitUnavailable\}/);
  assert.match(card, /<BookingSubmitUnavailable otherFlightHref=\{otherFlightHref\} roomsHref=\{roomsHref\} \/>/);
  assert.match(status, /Заказ не создан, деньги не списаны/);
});

await check('карточка заказа: подпись доплаты, примечание о цене, «Что входит в тур», подсказка при долгой загрузке', () => {
  assert.match(card, /<p>\{getFeesLabel\(packageData\)\}<\/p>/);
  assert.doesNotMatch(card, /<p>Доплаты и сборы<\/p>/);
  assert.match(card, /<BookingInclusions items=\{inclusions\}/);
  assert.match(card, /\{slowLoading \? <BookingSlowHint \/> : null\}/);
  assert.match(card, /Цена \{operatorName\} на момент проверки/);
});

await check('/checkout: без зашитых «Быстрое подтверждение» / «Включена в стоимость», без полного списка перелётов', () => {
  assert.doesNotMatch(checkout, /Быстрое подтверждение|Включена в стоимость|Не включен в стоимость/);
  assert.doesNotMatch(checkout, /Packagesflights/);
  assert.match(checkout, /getSelectedFlight\(packageId, flightPairId/);
  assert.match(checkout, /if \(!packageId \|\| !flightPairId\) return;/, 'без flight_pair_id не подставляет первый рейс');
  assert.match(checkout, /<InfoRow label="Подтверждение" value=\{confirmation\} \/>/);
  assert.match(checkout, /getBookingInclusions\(pkg/);
});

await check('отель → перелёты: адрес страницы отеля запоминается для «Вернуться к номерам»', () => {
  assert.match(flow, /saveBookingReturnUrl\(router\.asPath\)/);
  const idx = flow.indexOf('saveBookingReturnUrl(router.asPath)');
  assert.ok(idx > 0 && idx < flow.indexOf("router.push(`/tickets"), 'до перехода');
});

console.log(`\n${passed} ok, ${failed} failed`);
process.exit(failed ? 1 : 0);
