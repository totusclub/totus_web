import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import useAuth from '@/hooks/useAuth';
import type { RootState } from '@/store';
import {
    createClientMsgId,
    getSupportChat,
    getSupportMessages,
    markSupportRead,
    sendSupportMessage,
    supportErrorMessage,
} from '@/api/supportChatApi';
import { emitSupport } from '@/lib/supportSocket';
import {
    addOptimistic,
    confirmOptimistic,
    failOptimistic,
    prependMessages,
    removeMessage,
    setChat,
    setChatInfo,
    setError,
    setStatus,
    setTyping,
    setUnread,
    type SupportChatMessage,
} from '@/store/slices/supportChatSlice';
import SupportHeader from './SupportHeader';
import MessageList from './MessageList';
import Composer, { type ComposerHandle } from './Composer';
import EmptyState from './EmptyState';
import styles from './supportChat.module.css';

const PAGE_SIZE = 50;
const TYPING_AUTO_CLEAR_MS = 6000;

type SupportChatProps = {
    /** Телефон поддержки для кнопки звонка (не задан — кнопки нет) */
    supportPhone?: string | null;
    className?: string;
};

/** Карточка чата с поддержкой (desktop — справа от меню ЛК, mobile — на весь экран). */
export default function SupportChat({ supportPhone = null, className }: SupportChatProps) {
    const dispatch = useDispatch();
    const { user, token } = useAuth();
    const { chat, messages, hasMore, hours, status, error, typing } = useSelector(
        (state: RootState) => state.supportChat,
    );

    const [loadingMore, setLoadingMore] = useState(false);
    const [sending, setSending] = useState(false);
    const [banner, setBanner] = useState<string | null>(null);
    const composerRef = useRef<ComposerHandle>(null);
    const mountedRef = useRef(true);

    useEffect(() => {
        mountedRef.current = true;
        return () => {
            mountedRef.current = false;
        };
    }, []);

    const userId = (user as { id?: number } | null)?.id ?? null;

    // ---- загрузка диалога ----
    const load = useCallback(async () => {
        dispatch(setStatus('loading'));
        try {
            const data = await getSupportChat(PAGE_SIZE);
            if (!mountedRef.current) return;
            dispatch(setChat(data));
            // открыли чат — всё прочитано
            dispatch(setUnread(0));
            markSupportRead(data.chat?.lastMessageId ?? null)
                .then((res) => {
                    if (mountedRef.current && res?.chat) dispatch(setChatInfo({ ...res.chat, userUnread: 0 }));
                })
                .catch(() => {});
        } catch (err) {
            if (!mountedRef.current) return;
            dispatch(setError(supportErrorMessage(err)));
        }
    }, [dispatch]);

    useEffect(() => {
        if (!token) return;
        void load();
    }, [token, load]);

    // ---- новые входящие при открытой странице → отметить прочитанным ----
    const lastIncomingId = useMemo(() => {
        let max = 0;
        for (const m of messages) {
            if (m.senderRole !== 'user' && m.id > max) max = m.id;
        }
        return max;
    }, [messages]);

    useEffect(() => {
        if (status !== 'ready' || !lastIncomingId) return;
        const markNow = () => {
            if (typeof document !== 'undefined' && document.visibilityState !== 'visible') return;
            dispatch(setUnread(0));
            markSupportRead(lastIncomingId).catch(() => {});
        };
        markNow();
        document.addEventListener('visibilitychange', markNow);
        return () => document.removeEventListener('visibilitychange', markNow);
    }, [lastIncomingId, status, dispatch]);

    // ---- «печатает…» гаснет само, если сервер не прислал typing:false ----
    useEffect(() => {
        if (!typing) return;
        const timer = setTimeout(() => dispatch(setTyping(false)), TYPING_AUTO_CLEAR_MS);
        return () => clearTimeout(timer);
    }, [typing, dispatch]);

    // ---- история вверх ----
    const loadMore = useCallback(async () => {
        if (loadingMore || !hasMore) return;
        const first = messages.find((m) => m.id > 0);
        if (!first) return;
        setLoadingMore(true);
        try {
            const data = await getSupportMessages({ before: first.id, limit: PAGE_SIZE });
            if (!mountedRef.current) return;
            dispatch(prependMessages(data));
        } catch (err) {
            if (!mountedRef.current) return;
            setBanner(supportErrorMessage(err));
        } finally {
            if (mountedRef.current) setLoadingMore(false);
        }
    }, [loadingMore, hasMore, messages, dispatch]);

    // ---- отправка ----
    const deliver = useCallback(
        async (body: string, clientMsgId: string): Promise<boolean> => {
            setSending(true);
            setBanner(null);
            try {
                const res = await sendSupportMessage({ body, clientMsgId });
                if (!mountedRef.current) return true;
                dispatch(confirmOptimistic({ clientMsgId, message: res.message }));
                if (res.chat) dispatch(setChatInfo({ ...res.chat, userUnread: 0 }));
                return true;
            } catch (err) {
                if (!mountedRef.current) return false;
                const text = supportErrorMessage(err);
                dispatch(failOptimistic({ clientMsgId, error: text }));
                setBanner(text);
                return false;
            } finally {
                if (mountedRef.current) setSending(false);
            }
        },
        [dispatch],
    );

    const handleSend = useCallback(
        async (text: string): Promise<boolean> => {
            const clientMsgId = createClientMsgId();
            const optimistic: SupportChatMessage = {
                id: -Date.now(),
                chatId: chat?.id ?? 0,
                senderRole: 'user',
                senderId: userId,
                senderName: null,
                body: text,
                meta: null,
                clientMsgId,
                readAt: null,
                createdAt: new Date().toISOString(),
                pending: true,
            };
            dispatch(addOptimistic(optimistic));
            emitSupport('support:typing', { typing: false });
            // поле очищаем сразу — сообщение уже в ленте (при ошибке будет «Повторить»)
            void deliver(text, clientMsgId);
            return true;
        },
        [chat?.id, userId, dispatch, deliver],
    );

    const handleRetry = useCallback(
        (message: SupportChatMessage) => {
            if (!message.clientMsgId) return;
            dispatch(addOptimistic({ ...message, pending: true, failed: false, error: null }));
            void deliver(message.body, message.clientMsgId);
        },
        [dispatch, deliver],
    );

    const handleRemove = useCallback(
        (message: SupportChatMessage) => {
            if (message.clientMsgId) dispatch(removeMessage({ clientMsgId: message.clientMsgId }));
        },
        [dispatch],
    );

    // ---- typing пользователя (Composer сам троттлит: старт + стоп через 3 с) ----
    const handleTyping = useCallback((isTyping: boolean) => {
        emitSupport('support:typing', { typing: isTyping });
    }, []);

    const handleTopic = useCallback((topic: string) => {
        composerRef.current?.setText(topic);
    }, []);

    const isEmpty = status === 'ready' && messages.length === 0;
    const unavailable = status === 'error';

    return (
        <section className={`${styles.card} ${className || ''}`} aria-label="Чат с поддержкой">
            <SupportHeader phone={supportPhone} />

            {banner ? (
                <div className={styles.banner} role="alert">
                    <span>{banner}</span>
                    <button type="button" className={styles.bannerClose} onClick={() => setBanner(null)} aria-label="Закрыть">
                        ×
                    </button>
                </div>
            ) : null}

            <div className={styles.bodyWrap}>
                {status === 'idle' || status === 'loading' ? (
                    <div className={styles.loading}>
                        <span className={styles.spinner} />
                        <span>Загружаем диалог…</span>
                    </div>
                ) : unavailable ? (
                    <div className={styles.unavailable}>
                        <p className={styles.unavailableTitle}>{error || 'Чат временно недоступен'}</p>
                        <p className={styles.unavailableText}>Попробуйте обновить страницу чуть позже.</p>
                        <button type="button" className={styles.retryBtn} onClick={() => void load()}>
                            Повторить
                        </button>
                    </div>
                ) : isEmpty ? (
                    <EmptyState hoursText={hours?.text} onSelectTopic={handleTopic} />
                ) : (
                    <MessageList
                        messages={messages}
                        hasMore={hasMore}
                        loadingMore={loadingMore}
                        typing={typing}
                        onLoadMore={() => void loadMore()}
                        onRetry={handleRetry}
                        onRemove={handleRemove}
                    />
                )}
            </div>

            <Composer
                ref={composerRef}
                disabled={unavailable || status === 'loading' || status === 'idle'}
                sending={sending}
                showTopics={!isEmpty}
                onSend={handleSend}
                onTyping={handleTyping}
            />
        </section>
    );
}
