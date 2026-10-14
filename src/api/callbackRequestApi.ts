import { API_BASE_URL } from '@/config/api';
import type { Consents } from '@/config/legalLinks';

/** consents — галочки формы; сервер пишет их в журнал согласий после успешной заявки. */
export async function submitCallbackRequest(phone: string, consents: Consents): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/api/callback-requests`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, consents }),
    });

    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
        throw new Error(data?.message || 'Не удалось отправить запрос');
    }
}
