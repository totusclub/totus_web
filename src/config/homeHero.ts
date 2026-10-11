/**
 * Картинки hero главной — в самом сайте (public/hero), а не на бэкенде.
 *
 * Раньше сервер сайта на каждый заход спрашивал у API /api/home-hero, а картинка шла
 * с api.totus.club — отдельное соединение на пути главного элемента первого экрана (LCP).
 * Теперь три картинки лежат в public/hero (тот же домен, кеш на год, next.config.ts),
 * сервер сайта выбирает одну случайно на каждый заход — как раньше делал бэкенд.
 * Раздел «Изображения hero» в админке на сайт больше не влияет (решение владельца 11.10.2026).
 *
 * У каждой картинки две версии: компьютер (≈2010×783) и телефон (≈900×783, до 600 px),
 * каждая в AVIF (легче, ~30–70 %) и WebP (для браузеров без AVIF; те же файлы, что были на API).
 * Файлы собирает scripts/hero-assets.mjs. Заменить картинку — public/hero/README.md.
 */
import type { HomeHero } from '@/api/homeHeroApi';

export const HOME_HERO_TITLE = 'Путешествия начинаются здесь';

export type HomeHeroImage = {
    /** компьютер, WebP */
    image: string;
    /** компьютер, AVIF */
    imageAvif: string;
    /** телефон (до 600 px), WebP */
    imageMobile: string;
    /** телефон (до 600 px), AVIF */
    imageMobileAvif: string;
};

const heroFiles = (name: string): HomeHeroImage => ({
    image: `/hero/${name}.webp`,
    imageAvif: `/hero/${name}.avif`,
    imageMobile: `/hero/${name}-m.webp`,
    imageMobileAvif: `/hero/${name}-m.avif`,
});

/** Порядок — как был в админке (sort_order 0, 1, 2). */
export const HOME_HERO_IMAGES: HomeHeroImage[] = [heroFiles('hero-1'), heroFiles('hero-2'), heroFiles('hero-3')];

/** Случайная картинка hero на этот заход (getServerSideProps главной, src/lib/homeSsr.ts). */
export function pickHomeHero(random: () => number = Math.random): HomeHero {
    const count = HOME_HERO_IMAGES.length;
    const index = Math.min(count - 1, Math.max(0, Math.floor(random() * count)));
    return { title: HOME_HERO_TITLE, ...HOME_HERO_IMAGES[index] };
}
