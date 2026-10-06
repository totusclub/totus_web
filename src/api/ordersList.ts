/**
 * Список заказов для профиля: GET /user/orders?view=list (totus_API utils/orderListView.js).
 *
 * Полный /user/orders отдаёт по каждому заказу весь пакет Level.Travel (описание отеля, фото,
 * перелёты, вложения) — мегабайты, страница профиля ждала больше минуты. Карточке нужно ~25 полей;
 * их и отдаёт ?view=list. Страница заказа по-прежнему берёт полный заказ (getOrder → GET /orders).
 * Токен добавляет interceptor из src/api/http.ts.
 */
import axios from 'axios';
import { API_BASE_URL } from '@/config/api';

export async function getOrdersList(userId: string | number): Promise<any[]> {
    if (!userId) {
        throw new Error('Missing user_id');
    }
    const response = await axios.get(`${API_BASE_URL.replace(/\/+$/, '')}/user/orders`, {
        params: { user_id: userId, view: 'list' },
    });
    return Array.isArray(response.data) ? response.data : [];
}
