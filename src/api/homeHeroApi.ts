import { API_BASE_URL } from '@/config/api';

export interface HomeHero {
    title: string;
    /** Изображение, выбранное бэкендом случайно из всех hero-изображений админки ('' — изображений нет). */
    image: string;
}

const DEFAULT_TITLE = 'Путешествия начинаются здесь';

export async function getHomeHero(): Promise<HomeHero> {
    try {
        // Бэкенд при каждом запросе выбирает случайное изображение. Метка времени в URL
        // не даёт браузеру или прокси вернуть прошлый ответ — каждый заход на главную
        // получает новый выбор.
        const response = await fetch(`${API_BASE_URL}/api/home-hero?_=${Date.now()}`, { cache: 'no-store' });
        if (!response.ok) {
            return { title: DEFAULT_TITLE, image: '' };
        }
        const data = await response.json();
        return {
            title: data?.data?.title || DEFAULT_TITLE,
            image: data?.data?.image || '',
        };
    } catch {
        return { title: DEFAULT_TITLE, image: '' };
    }
}
