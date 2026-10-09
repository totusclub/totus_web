// Страница поиска на телефоне и планшете (до 1024 px) — макет «Поиск на телефоне», утверждён 09.10.2026:
// шапка (назад, колокольчик, фильтр — 40×40, без наложения), единые отступы 16/12, карточка 12/16,
// загрузка по форме настоящей страницы, оценка белая на зелёном, на планшете две колонки.
// Компьютер (> 1024 px) не меняется. Запуск: node scripts/check-search-mobile.mjs (без npm install).
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

/** Все правила файла: { media, selector, body } (вложенные @media разворачиваются). */
function rules(css) {
  const out = [];
  const walk = (text, media) => {
    let i = 0;
    while (i < text.length) {
      const open = text.indexOf('{', i);
      if (open < 0) break;
      const head = text.slice(i, open).trim();
      let depth = 1;
      let j = open + 1;
      while (j < text.length && depth) {
        if (text[j] === '{') depth++;
        else if (text[j] === '}') depth--;
        j++;
      }
      const body = text.slice(open + 1, j - 1);
      if (head.startsWith('@media')) walk(body, head);
      else if (!head.startsWith('@keyframes')) out.push({ media, selector: head.replace(/\s+/g, ' '), body });
      i = j;
    }
  };
  walk(noComments(css), '');
  return out;
}
/** Последнее значение свойства для селектора в данном @media. */
function decl(list, media, selector, prop) {
  let value;
  for (const r of list.filter((x) => x.media === media && x.selector.split(',').map((s) => s.trim()).includes(selector))) {
    for (const m of r.body.matchAll(new RegExp(`(?:^|;|\\s)${prop}\\s*:\\s*([^;]+);`, 'g'))) value = m[1].trim();
  }
  return value;
}

const TAB = '@media (max-width: 1024px)';
const MOB = '@media (max-width: 768px)';
const TWO = '@media (min-width: 600px) and (max-width: 1024px)';
const page = rules(read('src/components/searchPage/searchPage.module.css'));
const header = rules(read('src/components/header/header.module.css'));
const headerTsx = read('src/components/header/index.tsx');
const searchCss = rules(read('src/components/search/search.module.css'));
const form = read('src/components/search/searchForm.tsx');
const card = rules(read('src/components/hotelCard/hotelCard.module.css'));
const list = read('src/components/searchPage/searchResult/resultList.tsx');
const skel = read('src/components/searchPage/searchResult/mobileSkeleton.tsx');

console.log('Поиск на телефоне');

check('шапка: «назад», колокольчик и фильтр — 40×40, отступ 8 px, колокольчик левее фильтра на 4 px', () => {
  assert.equal(decl(header, '@media screen and (max-width: 1024px)', '.backM', 'top'), '8px');
  assert.equal(decl(header, '@media screen and (max-width: 1024px)', '.backM', 'left'), '8px');
  assert.equal(decl(header, '@media screen and (max-width: 1024px)', '.backM > div', 'width'), '40px');
  assert.equal(decl(header, '@media screen and (max-width: 1024px)', '.backM > div', 'height'), '40px');
  assert.equal(decl(header, '@media screen and (max-width: 1024px)', '.headerRowM.headerRowMWithFilter', 'right'), '52px');
  assert.equal(decl(header, '@media screen and (max-width: 1024px)', '.headerRowM.headerRowMWithFilter', 'position'), 'absolute');
  assert.equal(decl(page, TAB, '.buttonFilterMob', 'right'), '8px');
  assert.equal(decl(page, TAB, '.buttonFilterMob', 'top'), '8px');
  assert.equal(decl(page, TAB, '.buttonFilterMob', 'width'), '40px');
  assert.equal(decl(page, TAB, '.buttonFilterMob', 'height'), '40px');
  assert.match(headerTsx, /showSearch === 'search' \|\| showSearch === 'tickets' \? styles\.headerRowMWithFilter : ''/);
  assert.match(headerTsx, /token && showSearch !== 'hotel-details' \? <NotificationsBell variant="link" \/> : null/, 'кто видит колокольчик — не меняется');
});

check('значок фильтров как у колокольчика: оранжевый, обводка цвета фона', () => {
  assert.equal(decl(page, TAB, '.buttonFilterMob .filterBadge', 'background'), 'var(--core_Orange)');
  assert.equal(decl(page, TAB, '.buttonFilterMob .filterBadge', 'border'), '2px solid var(--bgPrimary)');
  assert.equal(decl(page, '', '.filterBadge', 'background'), '#cf3030', 'компьютер не тронут');
});

check('заголовок: по центру между кнопками, две строки с многоточием; «дата · ночи · туристы»', () => {
  assert.equal(decl(searchCss, TAB, '.selectdFormM', 'width'), 'calc(100% - 192px)');
  assert.equal(decl(searchCss, TAB, '.selectdFormM > p:nth-child(1)', 'font-size'), '15px');
  assert.equal(decl(searchCss, TAB, '.selectdFormM > p', 'text-overflow'), 'ellipsis');
  assert.match(form, /\{formatDateToRussian\(params\?\.start_date\)\} · \{params\?\.nights\} ночей · \{/);
  assert.ok(!/start_date\)\} , \{/.test(form));
});

check('отступы: первый блок через 12 px после шапки, между блоками 12 px, место под нижнее меню', () => {
  assert.equal(decl(page, TAB, '.searchResultWrapper', 'margin-top'), '68px');
  assert.equal(decl(page, MOB, '.searchResultWrapper', 'margin-top'), '32px', '35 + 1 у .searchContainer до 768 px');
  assert.equal(decl(page, TAB, '.searchResultWrapper', 'gap'), '12px');
  assert.equal(decl(page, TAB, '.resultListSelectedFilter', 'margin-top'), '0');
  assert.equal(decl(page, TAB, '.resultList', 'gap'), '12px');
  assert.equal(decl(page, TAB, '.resultListItems', 'gap'), '12px');
  assert.equal(decl(page, TAB, '.resultList', 'padding-bottom'), 'calc(56px + env(safe-area-inset-bottom, 0px))');
  assert.equal(decl(page, '', '.searchResultWrapper', 'margin-top'), '40px', 'компьютер не тронут');
});

check('карточка до 1024 px: поля 12, скругление 16, фото 200; оценка белая; компьютер 212×152 и 24 px', () => {
  assert.equal(decl(card, TAB, '.hotelCard', 'padding'), '12px');
  assert.equal(decl(card, TAB, '.hotelCard', 'border-radius'), '16px');
  assert.equal(decl(card, TAB, '.hotelCard', 'flex-direction'), 'column');
  assert.equal(decl(card, TAB, '.hotelCardImage', 'height'), '200px');
  assert.equal(decl(card, TAB, '.hotelCardName > p', 'font-size'), '18px');
  assert.equal(decl(card, TAB, '.hotelCardImageInfoM > p:nth-child(2)', 'color'), '#ffffff');
  assert.equal(decl(card, '', '.hotelCard', 'border-radius'), '24px');
  assert.equal(decl(card, '', '.hotelCardImage', 'width'), '212px');
  assert.equal(card.filter((r) => r.media === MOB).length, 0, 'старого блока до 768 px нет — всё в блоке до 1024');
});

check('планшет 600–1024: карточки в две колонки', () => {
  assert.equal(decl(page, TWO, '.resultListItems', 'display'), 'grid');
  assert.equal(decl(page, TWO, '.resultListItems', 'grid-template-columns'), 'repeat(2, minmax(0, 1fr))');
});

check('загрузка: на телефоне своя заглушка, на компьютере прежние Progress и HotelCard lazy', () => {
  assert.equal(decl(page, '', '.desktopOnly', 'display'), 'contents');
  assert.equal(decl(page, '', '.mobileOnly', 'display'), 'none');
  assert.equal(decl(page, TAB, '.desktopOnly', 'display'), 'none');
  assert.equal(decl(page, TAB, '.mobileOnly', 'display'), 'contents');
  assert.match(list, /<div className=\{styles\.desktopOnly\}>\s*<Progress title=\{'Ищем подходящие туры'\} loading=\{isSearching\} \/>/);
  assert.match(list, /<div className=\{styles\.desktopOnly\}>\s*(<HotelCard lazy request_id=\{data\?\.request_id\} item=\{null\} \/>\s*){3}<\/div>/);
  assert.match(list, /<div className=\{styles\.mobileOnly\}>\s*(<MobileHotelCardSkeleton \/>\s*){3}<\/div>/);
  assert.match(list, /\{isSearching && \(\s*<div className=\{styles\.mobileOnly\}>\s*<MobileSearchLoading title=\{'Ищем подходящие туры'\} \/>/);
  assert.match(list, /const showSkeleton = isSearching && !loadMore;/, 'когда показывать заглушку — не меняется');
});

check('заглушка по размерам настоящей карточки: блок 120 px, фото 200, кнопка 48', () => {
  assert.equal(decl(page, '', '.mobileLoading', 'height'), '120px');
  assert.equal(decl(page, '', '.skeletonCard', 'padding'), '12px');
  assert.equal(decl(page, '', '.skeletonCard', 'border-radius'), '16px');
  assert.match(skel, /<Bar width="100%" height=\{200\} \/>/);
  assert.match(skel, /<Bar width="100%" height=\{48\} radius=\{24\} \/>/);
  assert.match(decl(page, '', '.skeleton', 'background'), /var\(--bgSecondary\).*var\(--bgTertiary\)/, 'цвета из темы');
});

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed ? 1 : 0);
