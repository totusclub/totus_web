import { API_BASE_URL } from '@/config/api';

export interface FaqItem {
    id: number;
    question: string;
    answer: string;
    c_date?: string;
}

export async function getFaqItems(): Promise<FaqItem[]> {
    try {
        const response = await fetch(`${API_BASE_URL}/api/faq`, { cache: 'no-store' });
        if (!response.ok) return [];
        const data = await response.json();
        return Array.isArray(data?.data) ? data.data : [];
    } catch {
        return [];
    }
}
