import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/router';
import { useDispatch } from 'react-redux';
import useAuth from '@/hooks/useAuth';
import { AUTH_LOGOUT_EVENT } from '@/api/http';
import { getSupportChat, type SupportChat, type SupportMessage } from '@/api/supportChatApi';
import { connectSupportSocket, disconnectSupportSocket, onSupportEvent } from '@/lib/supportSocket';
import {
    appendMessage,
    applyReadReceipt,
    incrementUnread,
    reset,
    setChatInfo,
    setTyping,
    setUnread,
} from '@/store/slices/supportChatSlice';

export const SUPPORT_CHAT_PATH = '/profile/support-chat';

/**
 * Глобальный «шлюз» чата с поддержкой: после hydrate для авторизованного пользователя
 * подтягивает счётчик непрочитанных (chat.userUnread), держит socket.io-соединение с voip
 * и кладёт события support:* в Redux. Ничего не рендерит — второго плавающего виджета нет,
 * чтобы не конфликтовать с кнопкой Маши (GlobalAiChat).
 */
export default function SupportChatGate() {
    const { user, token } = useAuth();
    const dispatch = useDispatch();
    const router = useRouter();
    const [mounted, setMounted] = useState(false);
    const onChatPageRef = useRef(false);
    onChatPageRef.current = router.pathname === SUPPORT_CHAT_PATH;

    useEffect(() => {
        setMounted(true);
    }, []);

    // Счётчик непрочитанных при входе / после hydrate
    useEffect(() => {
        if (!mounted || !user || !token) return;
        let cancelled = false;
        getSupportChat(1)
            .then((data) => {
                if (cancelled) return;
                dispatch(setUnread(Number(data.chat?.userUnread || 0)));
            })
            .catch(() => {
                // чат недоступен (503/сеть) — молча, страница чата покажет сообщение
            });
        return () => {
            cancelled = true;
        };
    }, [mounted, user, token, dispatch]);

    // Socket.io: подключение и события
    useEffect(() => {
        if (!mounted || !user || !token) return;

        const socket = connectSupportSocket();
        if (!socket) return;

        const offMessage = onSupportEvent<{ chat?: SupportChat; message?: SupportMessage }>(
            'support:message',
            (payload) => {
                const message = payload?.message;
                if (!message) return;
                dispatch(appendMessage(message));
                if (message.senderRole !== 'user') {
                    if (onChatPageRef.current) {
                        // страница чата открыта — она сама отметит прочитанным
                        return;
                    }
                    if (payload.chat && typeof payload.chat.userUnread === 'number') {
                        dispatch(setUnread(payload.chat.userUnread));
                    } else {
                        dispatch(incrementUnread());
                    }
                }
            },
        );

        const offUpdated = onSupportEvent<{ chat?: SupportChat }>('support:chat-updated', (payload) => {
            if (payload?.chat) dispatch(setChatInfo(payload.chat));
        });

        const offRead = onSupportEvent<{ by?: 'user' | 'staff'; lastMessageId?: number | null; chat?: SupportChat }>(
            'support:read',
            (payload) => {
                if (payload?.by === 'staff') {
                    dispatch(applyReadReceipt({ lastMessageId: payload.lastMessageId ?? null }));
                }
                if (payload?.chat) dispatch(setChatInfo(payload.chat));
            },
        );

        const offTyping = onSupportEvent<{ from?: 'user' | 'staff'; typing?: boolean }>(
            'support:typing',
            (payload) => {
                if (payload?.from === 'user') return;
                dispatch(setTyping(Boolean(payload?.typing)));
            },
        );

        return () => {
            offMessage();
            offUpdated();
            offRead();
            offTyping();
        };
    }, [mounted, user, token, dispatch]);

    // Logout (кнопка «Выйти» или неудачный refresh) → закрыть сокет, сбросить состояние
    useEffect(() => {
        if (!mounted) return;
        const onLogout = () => {
            disconnectSupportSocket();
            dispatch(reset());
        };
        window.addEventListener(AUTH_LOGOUT_EVENT, onLogout);
        return () => window.removeEventListener(AUTH_LOGOUT_EVENT, onLogout);
    }, [mounted, dispatch]);

    useEffect(() => {
        if (!mounted) return;
        if (!user || !token) {
            disconnectSupportSocket();
            dispatch(reset());
        }
    }, [mounted, user, token, dispatch]);

    return null;
}
