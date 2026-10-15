import { forwardRef, useCallback, useEffect, useImperativeHandle, useRef, useState, type KeyboardEvent } from 'react';
import { SUPPORT_MESSAGE_MAX_LENGTH } from '@/api/supportChatApi';
import QuickTopics from './QuickTopics';
import styles from './supportChat.module.css';
import TotusIcon from '@/components/icons/totus/TotusIcon';
import { iconSend } from '@/components/icons/totus/icons.generated';

export type ComposerHandle = {
    setText: (text: string) => void;
    focus: () => void;
};

type ComposerProps = {
    disabled?: boolean;
    sending?: boolean;
    showTopics?: boolean;
    onSend: (text: string) => Promise<boolean> | boolean;
    onTyping?: (typing: boolean) => void;
};

/** Композер: textarea (Enter — отправить, Shift+Enter — перенос), кнопка отправки, чипы тем. */
const Composer = forwardRef<ComposerHandle, ComposerProps>(function Composer(
    { disabled, sending, showTopics = true, onSend, onTyping },
    ref,
) {
    const [text, setText] = useState('');
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const typingRef = useRef(false);
    const typingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const resize = useCallback(() => {
        const el = textareaRef.current;
        if (!el) return;
        el.style.height = 'auto';
        el.style.height = `${Math.min(el.scrollHeight, 140)}px`;
    }, []);

    useImperativeHandle(ref, () => ({
        setText: (value: string) => {
            setText(value);
            requestAnimationFrame(() => {
                resize();
                const el = textareaRef.current;
                if (el) {
                    el.focus();
                    el.setSelectionRange(el.value.length, el.value.length);
                }
            });
        },
        focus: () => textareaRef.current?.focus(),
    }));

    const stopTyping = useCallback(() => {
        if (typingTimerRef.current) {
            clearTimeout(typingTimerRef.current);
            typingTimerRef.current = null;
        }
        if (typingRef.current) {
            typingRef.current = false;
            onTyping?.(false);
        }
    }, [onTyping]);

    const noteTyping = useCallback(() => {
        if (!typingRef.current) {
            typingRef.current = true;
            onTyping?.(true);
        }
        if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
        typingTimerRef.current = setTimeout(() => {
            typingRef.current = false;
            typingTimerRef.current = null;
            onTyping?.(false);
        }, 3000);
    }, [onTyping]);

    useEffect(() => () => stopTyping(), [stopTyping]);

    const submit = useCallback(async () => {
        const value = text.trim();
        if (!value || disabled || sending) return;
        stopTyping();
        const ok = await onSend(value);
        if (ok) {
            setText('');
            requestAnimationFrame(resize);
        }
    }, [text, disabled, sending, onSend, stopTyping, resize]);

    const onKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
        if (event.key === 'Enter' && !event.shiftKey && !event.nativeEvent.isComposing) {
            event.preventDefault();
            void submit();
        }
    };

    const canSend = text.trim().length > 0 && !disabled && !sending;
    const tooLong = text.length > SUPPORT_MESSAGE_MAX_LENGTH;

    return (
        <div className={styles.composer}>
            {showTopics ? (
                <QuickTopics
                    disabled={disabled}
                    onSelect={(topic) => {
                        setText(topic);
                        requestAnimationFrame(() => {
                            resize();
                            textareaRef.current?.focus();
                        });
                    }}
                />
            ) : null}
            <div className={styles.composerRow}>
                <textarea
                    ref={textareaRef}
                    className={styles.input}
                    placeholder="Напишите сообщение…"
                    value={text}
                    rows={1}
                    disabled={disabled}
                    maxLength={SUPPORT_MESSAGE_MAX_LENGTH + 100}
                    onChange={(event) => {
                        setText(event.target.value);
                        resize();
                        if (event.target.value.trim()) noteTyping();
                        else stopTyping();
                    }}
                    onKeyDown={onKeyDown}
                    onBlur={stopTyping}
                    aria-label="Сообщение в поддержку"
                />
                <button
                    type="button"
                    className={styles.sendBtn}
                    disabled={!canSend || tooLong}
                    onClick={() => void submit()}
                    aria-label="Отправить"
                >
                    <TotusIcon icon={iconSend} size={20} accent={false} />
                </button>
            </div>
            {tooLong ? (
                <p className={styles.composerHint}>Сообщение слишком длинное (до 4000 символов)</p>
            ) : null}
        </div>
    );
});

export default Composer;
