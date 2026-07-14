import { API_BASE_URL } from '@/config/api';

export interface HomePartner {
    id: number;
    name: string;
    image: string;
    url: string;
    sort_order: number;
}

export async function getHomePartners(): Promise<HomePartner[]> {
    try {
        const response = await fetch(`${API_BASE_URL}/api/home-partners`, { cache: 'no-store' });
        if (!response.ok) return [];
        const data = await response.json();
        return Array.isArray(data?.data) ? data.data : [];
    } catch {
        return [];
    }
}
