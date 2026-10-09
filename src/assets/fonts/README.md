# Шрифты сайта

Все шрифты лежат в репозитории и подключаются из `src/styles/globals.css` (`@font-face`).
Next.js отдаёт их с totus.club как `/_next/static/media/…` с хешем в имени (кеш на год).
Google Fonts и внешние CDN не используются.

| Файл | Шрифт | Где используется | Лицензия |
|---|---|---|---|
| `MuseoSansCyrl-300.woff2` | Museo Sans Cyrl 300 | `--font-text`, `font-weight` 100–399 | коммерческая, exljbris (Jos Buivenga); нужна веб-лицензия владельца сайта |
| `MuseoSansCyrl-500.woff2` | Museo Sans Cyrl 500 | `--font-text`, `font-weight` 400–599 (основной текст) | то же |
| `MuseoSansCyrl-700.woff2` | Museo Sans Cyrl 700 | `--font-text`, `font-weight` 600–799 | то же |
| `MuseoSansCyrl-900.woff2` | Museo Sans Cyrl 900 | `--font-text`, `font-weight` 800+ | то же |
| `Forum-Regular.woff2` | Forum (без изменений, только упакован в WOFF2) | `--font-heading`: заголовки разделов и названия отелей | SIL OFL 1.1, `Forum-OFL.txt` |
| `GolosSymbols-500.woff2`, `GolosSymbols-700.woff2` | подмножество Golos Text: ₽, стрелки, неразрывный дефис, ²³¹ | «Totus Symbols» — знаки, которых нет в Museo и Forum (`unicode-range`, грузится только если знак есть на странице) | SIL OFL 1.1, `GolosText-OFL.txt` |

Старое имя `"Golos Text"` в `globals.css` указывает на те же файлы Museo — им пользуется виджет Милы (`@tosmedia/ai-assistant`).

При покупке Museo Sans Cyrl замените файлы `MuseoSansCyrl-*.woff2` файлами из купленного веб-пакета с теми же именами — CSS менять не нужно.
Проверка: `node scripts/check-pagespeed-c3.mjs` (наличие файлов, WOFF2, символы кириллицы и латиницы, ₽, отсутствие внешних шрифтов).
