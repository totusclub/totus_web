/**
 * Вход через Яндекс ID: тексты ошибок страницы /auth/yandex и разбор сбоя обмена ticket.
 * Без импортов — проверяется на чистом Node (scripts/check-yandex-auth-page.mjs).
 */

export interface YandexAuthErrorText {
    title: string;
    text: string;
}

/**
 * Сколько ждём ответа POST /api/auth/yandex/exchange. Сервер отвечает за доли секунды;
 * без тайм-аута зависший запрос держал «Завершаем вход…» бесконечно.
 */
export const YANDEX_EXCHANGE_TIMEOUT_MS = 20000;

export const YANDEX_AUTH_ERRORS: Record<string, YandexAuthErrorText> = {
    yandex_email_required: {
        title: 'Яндекс не передал адрес почты',
        text: 'Почта нужна, чтобы связать вход с вашим аккаунтом Totus Club. Разрешите доступ к почте на странице Яндекса или войдите по email.',
    },
    yandex_access_denied: {
        title: 'Вход отменён',
        text: 'Вы не разрешили доступ на странице Яндекса. Можно попробовать снова или войти по email.',
    },
    user_blocked: {
        title: 'Вход закрыт',
        text: 'Доступ к этому аккаунту ограничен. Напишите в поддержку — мы разберёмся.',
    },
    ticket_invalid: {
        title: 'Ссылка устарела',
        text: 'На подтверждение даётся две минуты. Начните вход заново.',
    },
    yandex_state_expired: {
        title: 'Время на вход истекло',
        text: 'Страница Яндекса была открыта слишком долго. Нажмите «Попробовать снова» — это займёт пару секунд.',
    },
    yandex_state_invalid: {
        title: 'Ссылка входа устарела',
        text: 'Начните вход через Яндекс заново с сайта.',
    },
    yandex_timeout: {
        title: 'Сервер не ответил',
        text: 'Не удалось завершить вход: нет ответа от сервера. Проверьте интернет и попробуйте снова.',
    },
};

export const YANDEX_AUTH_DEFAULT_ERROR: YandexAuthErrorText = {
    title: 'Не получилось войти',
    text: 'Попробуйте ещё раз или войдите по email.',
};

export function yandexAuthErrorText(code: string): YandexAuthErrorText {
    return (code && YANDEX_AUTH_ERRORS[code]) || YANDEX_AUTH_DEFAULT_ERROR;
}

/** Код ошибки из сбоя axios: ответ сервера → его error, тайм-аут → yandex_timeout, иначе yandex_failed. */
export function yandexExchangeErrorCode(error: any): string {
    const serverCode = error?.response?.data?.error;
    if (typeof serverCode === 'string' && serverCode) return serverCode;
    const code = String(error?.code || '');
    const message = String(error?.message || '').toLowerCase();
    if (code === 'ECONNABORTED' || code === 'ETIMEDOUT' || message.includes('timeout')) return 'yandex_timeout';
    return 'yandex_failed';
}
