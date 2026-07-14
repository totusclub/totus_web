import { API_BASE_URL } from '@/config/api';

export async function submitCallbackRequest(phone: string): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/api/callback-requests`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone }),
    });

    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
        throw new Error(data?.message || 'Не удалось отправить запрос');
    }
}
