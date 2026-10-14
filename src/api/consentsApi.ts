import axios from 'axios';
import { API_BASE_URL } from '@/config/api';
import type { Consents } from '@/config/legalLinks';

/**
 * Согласия вошедшего пользователя (totus_API POST /api/consents, только с токеном).
 * Нужен там, где данные уже получены другим путём: новый пользователь Яндекс ID.
 * Остальные формы передают consents прямо в своём запросе.
 */
export async function saveConsents(form: 'signup_yandex' | 'account', consents: Consents): Promise<void> {
    await axios.post(`${API_BASE_URL}/api/consents`, { form, consents });
}
