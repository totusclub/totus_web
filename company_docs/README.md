# company_docs — юридические документы ООО «ТОТУСКЛАБ»

Черновики документов Totus Club, составленные по образцу Ozon Travel. **На сайт пока не выкладываются**: папка лежит вне `src/` и `public/`, сборка Next.js её не использует.

Просмотр: артефакт «Документы Totus Club» — https://claude.ai/artifact/Xt4nZ2vbZuP93GAcV7BeMS

## Состав

| Путь | Что |
|---|---|
| `src/*.md` | тексты документов (Markdown с front matter: `title`, `short`, `slug`, `edition`, `ozon`) |
| `html/` | готовые страницы: `index.html` — оглавление, остальные — по одной на документ; стили в `doc.css` и `index.css` |
| `build.py`, `index_build.py` | сборщик HTML из `src/` (Python 3 + пакет `markdown`) |

Пачка 1 — платформа:

| Файл | Документ | Будущий адрес |
|---|---|---|
| `01-terms.md` | Пользовательское соглашение | totus.club/legal/terms |
| `02-privacy.md` | Политика обработки персональных данных | totus.club/legal/privacy |
| `03-consent.md` | Согласие на обработку персональных данных | totus.club/legal/consent |
| `04-ads-consent.md` | Согласие на получение рекламы | totus.club/legal/ads-consent |
| `05-cookies.md` | Политика использования файлов cookie | totus.club/legal/cookies |
| `06-recommendations.md` | Правила применения рекомендательных технологий | totus.club/legal/recommendations |
| `07-requisites.md` | Реквизиты и контакты | totus.club/legal/requisites |

Пачка 2 (туры и размещение) и пачка 3 — в работе, список в оглавлении.

## Разметка

- `[[…]]` — поле, которое нужно заполнить (в HTML подсвечено жёлтым).
- Блоки `> …` — служебные заметки для владельца и юриста, на сайт не публикуются.

## Сборка

```bash
pip install markdown
python3 build.py && python3 index_build.py   # результат — в build/
```

## Статус

Черновики. Перед публикацией на сайте — заполнить поля и согласовать с юристом.
