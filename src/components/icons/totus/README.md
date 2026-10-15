# Иконки Totus — стиль C

Единый набор иконок сайта: графитовая линия 1,5, скруглённые концы, одна деталь фирменным оранжевым `#FE732E`.
Утверждён владельцем 15.10.2026. 276 иконок в 12 разделах.

- Источник правды — Figma `u6A5og35jw0BBJyOkKl8Ij`, страница «ICONS · Набор C» (светлая и тёмная доски, компоненты `icon/<раздел>/<ключ>`).
- Данные для кода — `scripts/icons/totus-icons.json` (пути 24×24, номера оранжевых путей).
- Полный перечень и откуда взялась каждая иконка — `claude/ICONS_PLAN_RU.md` в проекте.
- Основа рисунка — [Tabler Icons](https://tabler.io/icons), лицензия MIT (`LICENSE-tabler.txt`); 13 иконок дорисованы под Totus.

## Файлы

| Файл | Что внутри |
|---|---|
| `TotusIcon.tsx` | компонент: `<TotusIcon icon={iconSearch} size={20} />` |
| `TotusIconByKey.tsx` | иконка по ключу, когда ключ приходит из данных: `<TotusIconByKey name={mealIcon(code)} />` |
| `icons.generated.ts` | по одной константе на иконку (`iconSearch`, `iconMealAi`…) — в сборку попадают только используемые |
| `registry.generated.ts` | ключ → иконка, русские подписи, разделы, тип `TotusIconKey` |
| `ltIcons.ts` | соответствия справочникам Level.Travel: питание, тип размещения, Wi-Fi, пляж, категория, удобства, удобства номера, уведомления |

Файлы `*.generated.ts` руками не правятся.

## Цвет и тема

Линия — `var(--icon-ink, currentColor)`, то есть цвет текста. Деталь — `var(--icon-accent, #FE732E)`.

```css
.onOrangeButton { --icon-accent: currentColor; }  /* иконка одним цветом */
```

То же пропсами: `color`, `accentColor`, `accent={false}`. Тёмная тема работает сама — через `currentColor`.

## Доступность

Без `title` иконка декоративная (`aria-hidden`). Если иконка — единственное содержимое кнопки, передайте `title` или подпишите кнопку `aria-label`.

## Как изменить набор

1. Поправить иконку в Figma (страница «ICONS · Набор C»).
2. Перенести пути и номера оранжевых путей в `scripts/icons/totus-icons.json`.
3. `node scripts/icons/gen-totus-icons.mjs`
4. `node --experimental-strip-types scripts/check-totus-icons.mjs` — проверка набора и соответствий Level.Travel (Node 22+).
