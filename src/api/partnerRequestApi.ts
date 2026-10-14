import { API_BASE_URL } from '@/config/api';
import type { Consents } from '@/config/legalLinks';

export type PartnerKind = 'operator' | 'hotel' | 'ads' | 'other';

export interface PartnerRequestInput {
    company: string;
    name: string;
    email: string;
    phone: string;
    kind: PartnerKind;
    message: string;
    /** Скрытое поле-ловушка для ботов, у людей всегда пустое. */
    website: string;
    /** Галочки формы — сервер пишет их в журнал согласий после успешной заявки. */
    consents: Consents;
}

/** Заявка «Стать партнёром» → totus_API → админка («Заявки партнёров»). */
export async function submitPartnerRequest(input: PartnerRequestInput): Promise<void> {
    let response: Response;
    try {
        response = await fetch(`${API_BASE_URL}/api/partner-requests`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(input),
        });
    } catch {
        throw new Error('Нет связи с сервером. Проверьте интернет и попробуйте ещё раз.');
    }
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
        throw new Error(data?.message || 'Не удалось отправить заявку, попробуйте позже');
    }
}
