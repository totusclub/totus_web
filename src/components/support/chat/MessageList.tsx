import { useCallback, useEffect, useLayoutEffect, useMemo, useRef } from 'react';
import type { SupportChatMessage } from '@/store/slices/supportChatSlice';
import MessageItem from './MessageItem';
import { groupMessagesByDate } from './utils';
import styles from './supportChat.module.css';

type MessageListProps = {
    messages: SupportChatMessage[];
    hasMore: boolean;
    loadingMore: boolean;
    typing: boolean;
    onLoadMore: () => void;
    onRetry: (message: SupportChatMessage) => void;
    onRemove: (message: SupportChatMessage) => void;
};

const NEAR_BOTTOM_PX = 120;
const NEAR_TOP_PX = 60;

/** Лента: разделители дат, пузыри, «печатает…», подгрузка истории вверх, автоскролл вниз. */
export default function MessageList({
    messages,
    hasMore,
    loadingMore,
    typing,
    onLoadMore,
    onRetry,
    onRemove,
}: MessageListProps) {
    const scrollRef = useRef<HTMLDivElement>(null);
    const stickToBottomRef = useRef(true);
    const prevHeightRef = useRef<number | null>(null);
    const prevFirstIdRef = useRef<number | null>(null);
    const prevLastKeyRef = useRef<string | null>(null);

    const groups = useMemo(() => groupMessagesByDate(messages), [messages]);
    const firstId = messages.length ? messages[0].id : null;
    const last = messages.length ? messages[messages.length - 1] : null;
    const lastKey = last ? `${last.id}:${last.clientMsgId || ''}:${last.pending ? 1 : 0}` : null;

    const handleScroll = useCallback(() => {
        const el = scrollRef.current;
        if (!el) return;
        const distance = el.scrollHeight - el.scrollTop - el.clientHeight;
        stickToBottomRef.current = distance < NEAR_BOTTOM_PX;
        if (el.scrollTop < NEAR_TOP_PX && hasMore && !loadingMore) {
            prevHeightRef.current = el.scrollHeight;
            onLoadMore();
        }
    }, [hasMore, loadingMore, onLoadMore]);

    // Сохранить позицию при подгрузке истории сверху
    useLayoutEffect(() => {
        const el = scrollRef.current;
        if (!el) return;
        const prependHappened =
            prevFirstIdRef.current !== null && firstId !== null && firstId < prevFirstIdRef.current;
        if (prependHappened && prevHeightRef.current !== null) {
            el.scrollTop += el.scrollHeight - prevHeightRef.current;
        }
        prevHeightRef.current = null;
        prevFirstIdRef.current = firstId;
    }, [firstId]);

    // Автоскролл вниз: при первом рендере, при новом сообщении (если были у низа или это наше), при «печатает»
    useEffect(() => {
        const el = scrollRef.current;
        if (!el) return;
        const isNew = lastKey !== prevLastKeyRef.current;
        prevLastKeyRef.current = lastKey;
        const ownNew = isNew && last?.senderRole === 'user';
        if (stickToBottomRef.current || ownNew) {
            el.scrollTop = el.scrollHeight;
        }
    }, [lastKey, last?.senderRole, typing, groups.length]);

    return (
        <div ref={scrollRef} className={styles.list} onScroll={handleScroll}>
            {hasMore ? (
                <div className={styles.loadMoreRow}>
                    <button
                        type="button"
                        className={styles.loadMoreBtn}
                        disabled={loadingMore}
                        onClick={() => {
                            if (scrollRef.current) prevHeightRef.current = scrollRef.current.scrollHeight;
                            onLoadMore();
                        }}
                    >
                        {loadingMore ? 'Загрузка…' : 'Показать ранее'}
                    </button>
                </div>
            ) : null}

            {groups.map((group) => (
                <div key={group.key} className={styles.group}>
                    <div className={styles.divider}>
                        <span>{group.label}</span>
                    </div>
                    {group.messages.map((message, index) => {
                        const prev = index > 0 ? group.messages[index - 1] : null;
                        const compact =
                            Boolean(prev) &&
                            prev!.senderRole === message.senderRole &&
                            prev!.senderId === message.senderId &&
                            message.senderRole !== 'system';
                        return (
                            <MessageItem
                                key={message.id < 0 ? `local-${message.clientMsgId}` : message.id}
                                message={message}
                                compact={compact}
                                onRetry={onRetry}
                                onRemove={onRemove}
                            />
                        );
                    })}
                </div>
            ))}

            {typing ? (
                <div className={`${styles.row} ${styles.rowIn}`}>
                    <div className={`${styles.bubble} ${styles.bubbleIn} ${styles.typingBubble}`} aria-label="Оператор печатает">
                        <span className={styles.typingDots}>
                            <i />
                            <i />
                            <i />
                        </span>
                        <span className={styles.typingText}>печатает…</span>
                    </div>
                </div>
            ) : null}
        </div>
    );
}
