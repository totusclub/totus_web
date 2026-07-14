import { API_BASE_URL } from '@/config/api';

export interface HomeHero {
    title: string;
    image: string;
}

const DEFAULT_TITLE = 'Путешествия начинаются здесь';

export async function getHomeHero(): Promise<HomeHero> {
    try {
        const response = await fetch(`${API_BASE_URL}/api/home-hero`, { cache: 'no-store' });
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
