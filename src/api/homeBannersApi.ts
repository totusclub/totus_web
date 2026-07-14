import { API_BASE_URL } from '@/config/api';

export interface HomeBanner {
    position: number;
    image: string;
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
