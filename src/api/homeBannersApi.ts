import { API_BASE_URL } from '@/config/api';

export interface HomeBanner {
    position: number;
    /** Картинка для светлой темы ('' — не загружена). */
    image: string;
    /** Картинка для тёмной темы ('' или нет поля — не загружена, показывается светлая). */
    image_dark?: string;
    url: string;
}

export async function getHomeBanners(): Promise<HomeBanner[]> {
    try {
        const response = await fetch(`${API_BASE_URL}/api/home-banners`, { cache: 'no-store' });
        if (!response.ok) return [];
        const data = await response.json();
        return Array.isArray(data?.data) ? data.data : [];
    } catch {
        return [];
    }
}
