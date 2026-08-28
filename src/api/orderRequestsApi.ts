import { API_BASE_URL } from '@/config/api';
import { loadToken } from '@/utils/auth';

export type OrderRequestType = 'cancel' | 'message';
export type OrderRequestStatus = 'new' | 'in_progress' | 'done' | 'rejected';

export interface OrderRequest {
    id: number;
    order_id: string | number;
    type: OrderRequestType;
    message: string | null;
    status: OrderRequestStatus;
    created_at: string;
}

export interface CreateOrderRequestParams {
    orderId: string | number;
    type: OrderRequestType;
    message?: string;
}

const ERROR_MESSAGES: Record<string, string> = {
    order_id_required: 'Не указан номер заказа',
    invalid_type: 'Неверный тип обращения',
    message_required: 'Введите текст сообщения',
    message_too_long: 'Сообщение слишком длинное, сократите текст',
    unauthorized: 'Требуется авторизация. Войдите в аккаунт и попробуйте снова',
    order_not_found: 'Заказ не найден',
    cancel_request_exists: 'Запрос на отмену уже отправлен и находится в обработке',
};

const DEFAULT_ERROR = 'Не удалось отправить запрос. Попробуйте позже';

function authHeaders(): Record<string, string> {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    const token = loadToken();
    if (token) {
        headers.Authorization = `Bearer ${token}`;
    }
    return headers;
}

async function toError(response: Response): Promise<Error> {
    const data = await response.json().catch(() => ({}));
    const code = (data as { error?: string })?.error;
    return new Error((code && ERROR_MESSAGES[code]) || DEFAULT_ERROR);
}

export async function createOrderRequest({
    orderId,
    type,
    message,
}: CreateOrderRequestParams): Promise<{ ok: boolean; id: number }> {
    const response = await fetch(`${API_BASE_URL}/api/order-requests`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({
            order_id: orderId,
            type,
            ...(message ? { message } : {}),
        }),
    });

    if (!response.ok) {
        throw await toError(response);
    }

    return response.json();
}

export async function getOrderRequests(
    orderId: string | number,
): Promise<OrderRequest[]> {
    const response = await fetch(
        `${API_BASE_URL}/api/order-requests?order_id=${encodeURIComponent(String(orderId))}`,
        {
            headers: authHeaders(),
        },
    );

    if (!response.ok) {
        throw await toError(response);
    }

    const data = await response.json().catch(() => ({ data: [] }));
    return ((data as { data?: OrderRequest[] })?.data ?? []) as OrderRequest[];
}
