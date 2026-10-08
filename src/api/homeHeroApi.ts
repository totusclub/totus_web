import { API_BASE_URL } from '@/config/api';

export interface HomeHero {
    title: string;
    /** Изображение, выбранное бэкендом случайно из всех hero-изображений админки ('' — изображений нет). */
    image: string;
    /**
     * Та же картинка, обрезанная по центру для телефона (~50 КБ вместо ~300 КБ; бэкенд создаёт её
     * в фоне, lib/heroMobile.js). '' — версии пока нет: телефон показывает image, как раньше.
     */
    imageMobile?: string;
}

/** Ширина экрана, до которой hero показывает мобильную версию (CSS search.module.css и preload в pages/index.tsx). */
export const HERO_MOBILE_MAX_WIDTH = 600;
export const HERO_MOBILE_MEDIA = `(max-width: ${HERO_MOBILE_MAX_WIDTH}px)`;
export const HERO_DESKTOP_MEDIA = `(min-width: ${HERO_MOBILE_MAX_WIDTH + 1}px)`;

const DEFAULT_TITLE = 'Путешествия начинаются здесь';

export async function getHomeHero(): Promise<HomeHero> {
    try {
        // Бэкенд при каждом запросе выбирает случайное изображение. Метка времени в URL
        // не даёт браузеру или прокси вернуть прошлый ответ — каждый заход на главную
        // получает новый выбор.
        const response = await fetch(`${API_BASE_URL}/api/home-hero?_=${Date.now()}`, { cache: 'no-store' });
        if (!response.ok) {
            return { title: DEFAULT_TITLE, image: '', imageMobile: '' };
        }
        const data = await response.json();
        return {
            title: data?.data?.title || DEFAULT_TITLE,
            image: data?.data?.image || '',
            imageMobile: data?.data?.image_mobile || '',
        };
    } catch {
        return { title: DEFAULT_TITLE, image: '', imageMobile: '' };
    }
}
