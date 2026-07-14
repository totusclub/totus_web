import { API_BASE_URL } from '@/config/api';

export interface FooterSocialLink {
    id: number;
    title: string;
    icon: string;
    url: string;
    sort_order: number;
    is_active: boolean;
}

export async function getFooterSocialLinks(): Promise<FooterSocialLink[]> {
    try {
        const response = await fetch(`${API_BASE_URL}/api/footer-social`, { cache: 'no-store' });
        if (!response.ok) return [];
        const data = await response.json();
        return Array.isArray(data?.data) ? data.data : [];
    } catch {
        return [];
    }
}
