import React, { useCallback, useEffect, useMemo, useState } from 'react';
import styles from './orderChangeRequest.module.css';
import AppModal from '@/components/UI/modal';
import { loadToken } from '@/utils/auth';
import {
    createOrderRequest,
    getOrderRequests,
    OrderRequest,
    OrderRequestStatus,
    OrderRequestType,
} from '@/api/orderRequestsApi';

const STATUS_LABELS: Record<OrderRequestStatus, string> = {
    new: 'Новое',
    in_progress: 'В работе',
    done: 'Выполнено',
    rejected: 'Отклонено',
};

const TYPE_LABELS: Record<OrderRequestType, string> = {
    cancel: 'Запрос отмены',
    message: 'Сообщение',
};

const formatRequestDate = (value: string): string => {
    if (!value) return '';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '';
    return new Intl.DateTimeFormat('ru-RU', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
    }).format(date);
};

interface OrderChangeRequestProps {
    orderId?: string | number | null;
}

const OrderChangeRequest: React.FC<OrderChangeRequestProps> = ({ orderId }) => {
    const [hasToken, setHasToken] = useState(false);
    const [requests, setRequests] = useState<OrderRequest[]>([]);
    const [modalOpen, setModalOpen] = useState(false);
    const [cancelReason, setCancelReason] = useState('');
    const [messageText, setMessageText] = useState('');
    const [submitting, setSubmitting] = useState<OrderRequestType | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    useEffect(() => {
        setHasToken(Boolean(loadToken()));
    }, []);

    const loadRequests = useCallback(() => {
        if (!orderId) return;
        getOrderRequests(orderId)
            .then(setRequests)
            .catch(() => {});
    }, [orderId]);

    useEffect(() => {
        if (hasToken) {
            loadRequests();
        }
    }, [hasToken, loadRequests]);

    const hasActiveCancelRequest = useMemo(
        () =>
            requests.some(
                (request) =>
                    request.type === 'cancel' &&
                    (request.status === 'new' || request.status === 'in_progress'),
            ),
        [requests],
    );

    if (!hasToken || !orderId) {
        return null;
    }

    const closeModal = () => {
        setModalOpen(false);
        setError(null);
        setSuccess(false);
        setCancelReason('');
        setMessageText('');
    };

    const handleSubmit = async (type: OrderRequestType) => {
        if (submitting) return;
        const message =
            type === 'cancel' ? cancelReason.trim() : messageText.trim();
        if (type === 'message' && !message) {
            setError('Введите текст сообщения');
            return;
        }
        setSubmitting(type);
        setError(null);
        try {
            await createOrderRequest({
                orderId,
                type,
                message: message || undefined,
            });
            setSuccess(true);
            setCancelReason('');
            setMessageText('');
            loadRequests();
        } catch (err) {
            setError(
                err instanceof Error
                    ? err.message
                    : 'Не удалось отправить запрос. Попробуйте позже',
            );
        } finally {
            setSubmitting(null);
        }
    };

    return (
        <div className={styles.wrapper}>
            <button
                type="button"
                className={styles.changeOrderButton}
                onClick={() => setModalOpen(true)}
            >
                Изменить заказ
            </button>

            {requests.length > 0 && (
                <div className={styles.requestsList}>
                    {requests.map((request) => (
                        <div key={request.id} className={styles.requestRow}>
                            <div className={styles.requestRowInfo}>
                                <p className={styles.requestType}>
                                    {TYPE_LABELS[request.type] ?? request.type}
                                </p>
                                <p className={styles.requestDate}>
                                    {formatRequestDate(request.created_at)}
                                </p>
                            </div>
                            <span
                                className={`${styles.statusBadge} ${
                                    styles[`status_${request.status}`] ?? ''
                                }`}
                            >
                                {STATUS_LABELS[request.status] ?? request.status}
                            </span>
                        </div>
                    ))}
                </div>
            )}

            <AppModal
                isOpen={modalOpen}
                onClose={closeModal}
                onBack={closeModal}
                title="Изменить заказ"
                width="480px"
            >
                {success ? (
                    <div className={styles.successBlock}>
                        <p className={styles.successText}>
                            Обращение отправлено. Мы свяжемся с вами.
                        </p>
                        <button
                            type="button"
                            className={styles.submitButton}
                            onClick={closeModal}
                        >
                            Закрыть
                        </button>
                    </div>
                ) : (
                    <div className={styles.modalContent}>
                        <div className={styles.requestBlock}>
                            <p className={styles.blockTitle}>
                                Запросить отмену заказа
                            </p>
                            {hasActiveCancelRequest ? (
                                <p className={styles.blockHint}>
                                    Запрос на отмену уже отправлен и находится в
                                    обработке
                                </p>
                            ) : (
                                <>
                                    <textarea
                                        className={styles.textarea}
                                        placeholder="Причина (необязательно)"
                                        value={cancelReason}
                                        onChange={(e) =>
                                            setCancelReason(e.target.value)
                                        }
                                        rows={3}
                                    />
                                    <button
                                        type="button"
                                        className={styles.submitButton}
                                        onClick={() => handleSubmit('cancel')}
                                        disabled={submitting !== null}
                                    >
                                        {submitting === 'cancel'
                                            ? 'Отправка…'
                                            : 'Запросить отмену'}
                                    </button>
                                </>
                            )}
                        </div>

                        <div className={styles.blockDivider}></div>

                        <div className={styles.requestBlock}>
                            <p className={styles.blockTitle}>Отправить сообщение</p>
                            <textarea
                                className={styles.textarea}
                                placeholder="Опишите, что нужно изменить в заказе"
                                value={messageText}
                                onChange={(e) => setMessageText(e.target.value)}
                                rows={3}
                            />
                            <button
                                type="button"
                                className={styles.submitButton}
                                onClick={() => handleSubmit('message')}
                                disabled={
                                    submitting !== null || !messageText.trim()
                                }
                            >
                                {submitting === 'message'
                                    ? 'Отправка…'
                                    : 'Отправить сообщение'}
                            </button>
                        </div>

                        {error && <p className={styles.errorText}>{error}</p>}
                    </div>
                )}
            </AppModal>
        </div>
    );
};

export default OrderChangeRequest;
