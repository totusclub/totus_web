# Картинки hero главной

Три картинки первого экрана главной (раньше — раздел «Изображения hero» в админке; с 11.10.2026 админка на сайт не влияет).
Список и случайный выбор — `src/config/homeHero.ts`, показ — `src/components/search/index.tsx` + `heroAvif.module.css`.

| Файл | Где | Размер |
|---|---|---|
| `hero-N.avif` / `hero-N.webp` | компьютер (шире 600 px) | ≈2010×783 |
| `hero-N-m.avif` / `hero-N-m.webp` | телефон (до 600 px) | ≈900×783 |

AVIF показывается браузерам, которые его понимают (почти все), WebP — запасной.

## Собрать или заменить
```bash
npm i --no-save sharp                                   # package.json не меняется
node scripts/hero-assets.mjs                            # три текущие картинки с API
node scripts/hero-assets.mjs hero-2=~/Pictures/new.jpg  # заменить вторую своей
```
Файлы кешируются браузером на год (`next.config.ts`, `/hero/:file*`). **Новая картинка — новое имя**:
после запуска со своим файлом переименуйте четыре файла `hero-2.*`, `hero-2-m.*` в `hero-2b.*`, `hero-2b-m.*`
и поменяйте имя в `src/config/homeHero.ts` (`heroFiles('hero-2b')`), иначе у вернувшихся посетителей останется старая.
