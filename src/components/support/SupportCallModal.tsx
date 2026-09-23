/**
 * Карточка звонка в поддержку (макет «SUPPORT CALL · Light/Dark» в Figma).
 *
 * Поведение перенесено из панели оператора (`calling_v2/components/CallModal.tsx`):
 * состояние опрашивается у сервиса каждые 500 мс, таймер считается от startedAt,
 * кнопки дергают те же функции сервиса. Разница — набор состояний под сценарий
 * «пользователь звонит в поддержку» и вид по макету сайта.
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import styles from './supportCall.module.css';
import {
    type CallErrorKind,
    type CallState,
    answerCall,
    endCall,
    getActiveCallInfo,
    getCallState,
    rejectCall,
    resetCallState,
    toggleMute,
} from '@/lib/supportCall';
import { SUPPORT_DISPLAY_NAME, SUPPORT_PHONE_NUMBER, formatSupportPhone } from '@/config/support';

interface Props {
    onWriteToChat: () => void;
    onRetry: () => void;
}

function formatDuration(startedAt: number | null): string {
    if (!startedAt) return '00:00';
    const total = Math.max(0, Math.floor((Date.now() - startedAt) / 1000));
    const h = Math.floor(total / 3600);
    const m = Math.floor((total % 3600) / 60);
    const s = total % 60;
    const pad = (n: number) => String(n).padStart(2, '0');
    return h > 0 ? `${pad(h)}:${pad(m)}:${pad(s)}` : `${pad(m)}:${pad(s)}`;
}

const MicIcon = ({ muted }: { muted: boolean }) => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path d="M12 15a3 3 0 0 0 3-3V6a3 3 0 1 0-6 0v6a3 3 0 0 0 3 3Z" fill="currentColor" />
        <path d="M18 12a6 6 0 0 1-12 0M12 18v3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        {muted && <path d="M4 4l16 16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />}
    </svg>
);

const SpeakerIcon = () => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path d="M5 9v6h4l5 4V5L9 9H5Z" fill="currentColor" />
        <path d="M17 9a4 4 0 0 1 0 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
);

const HangUpIcon = () => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path
            d="M3 10c5-4 13-4 18 0l-1.5 3-3.5-.5-.7-2.2c-2.1-.7-4.5-.7-6.6 0L8 12.5 4.5 13 3 10Z"
            fill="currentColor"
        />
    </svg>
);

const SupportCallModal = ({ onWriteToChat, onRetry }: Props) => {
    const [state, setState] = useState<CallState>('idle');
    const [muted, setMuted] = useState(false);
    const [error, setError] = useState<CallErrorKind | null>(null);
    const [startedAt, setStartedAt] = useState<number | null>(null);
    const [now, setNow] = useState(Date.now());
    const [minimized, setMinimized] = useState(false);
    const prevState = useRef<CallState>('idle');

    // Опрос состояния сервиса — как в панели оператора.
    useEffect(() => {
        const id = setInterval(() => {
            const call = getCallState();
            const active = getActiveCallInfo();
            setState(call.state);
            setMuted(call.isMuted);
            setError(call.error);
            setStartedAt(active.startedAt);
            setNow(Date.now());
        }, 500);
        return () => clearInterval(id);
    }, []);

    // Новый звонок разворачивает карточку обратно.
    useEffect(() => {
        if (prevState.current === 'idle' && state !== 'idle') setMinimized(false);
        prevState.current = state;
    }, [state]);

    const close = useCallback(() => {
        resetCallState();
        setMinimized(false);
    }, []);

    if (state === 'idle') return null;

    const duration = formatDuration(startedAt);
    const isFinished = state === 'ended' || state === 'rejected';
    const isIncoming = state === 'ringing';

    if (minimized) {
        return (
            <div className={styles.miniBar} role="status">
                <div className={styles.miniAvatar} aria-hidden="true">П</div>
                <div className={styles.miniText}>
                    <p className={styles.miniTitle}>{SUPPORT_DISPLAY_NAME}</p>
                    <span className={styles.miniStatus}>
                        {state === 'answered' ? `${duration} · разговор` : state === 'calling' ? 'Вызов…' : 'Входящий звонок'}
                    </span>
                </div>
                <button
                    type="button"
                    className={`${styles.ctrlButton} ${styles.ctrlDanger} ${styles.miniHangUp}`}
                    onClick={() => (isIncoming ? void rejectCall() : endCall())}
                    aria-label="Завершить звонок"
                >
                    <HangUpIcon />
                </button>
                <button type="button" className={styles.miniExpand} onClick={() => setMinimized(false)}>
                    Развернуть
                </button>
            </div>
        );
    }

    let statusText = 'Вызов…';
    let statusClass = styles.status;
    let hint = 'Ожидаем ответа оператора';

    if (state === 'answered') {
        statusText = duration;
        statusClass = `${styles.status} ${styles.statusTimer}`;
        hint = 'Соединение установлено';
    } else if (isIncoming) {
        statusText = 'Входящий звонок';
        hint = 'Оператор поддержки звонит вам';
    } else if (isFinished) {
        if (error === 'microphone') {
            statusText = 'Нужен доступ к микрофону';
            hint = 'Разрешите доступ в окне браузера — без микрофона звонок не состоится';
        } else if (error === 'offline') {
            statusText = 'Не удалось дозвониться';
            statusClass = `${styles.status} ${styles.statusError}`;
            hint = 'Оператор сейчас не на линии. Напишите в чат — ответим в течение 5 минут.';
        } else if (state === 'rejected') {
            statusText = 'Звонок отклонён';
            statusClass = `${styles.status} ${styles.statusError}`;
            hint = 'Попробуйте позвонить позже или напишите в чат';
        } else {
            statusText = 'Звонок завершён';
            hint = startedAt ? `Длительность ${duration}` : 'Напишите в чат, если вопрос остался';
        }
    }

    return (
        <div className={styles.overlay} role="dialog" aria-modal="true" aria-label="Звонок в поддержку">
            <div className={styles.card}>
                {(state === 'calling' || state === 'answered' || isIncoming) && (
                    <button
                        type="button"
                        className={styles.minimize}
                        onClick={() => setMinimized(true)}
                        aria-label="Свернуть звонок"
                    >
                        ×
                    </button>
                )}

                <div className={styles.avatar} aria-hidden="true">П</div>
                <p className={styles.name}>{SUPPORT_DISPLAY_NAME}</p>
                <p className={statusClass}>{statusText}</p>
                <p className={`${styles.hint} ${state === 'answered' ? styles.hintOk : ''}`}>{hint}</p>

                {(state === 'calling' || state === 'answered') && (
                    <div className={styles.controls}>
                        {state === 'answered' && (
                            <button
                                type="button"
                                className={styles.ctrl}
                                onClick={() => setMuted(toggleMute())}
                                aria-pressed={muted}
                            >
                                <span className={`${styles.ctrlButton} ${muted ? styles.ctrlActive : ''}`}>
                                    <MicIcon muted={muted} />
                                </span>
                                <span className={styles.ctrlLabel}>{muted ? 'Включить' : 'Микрофон'}</span>
                            </button>
                        )}
                        <div className={styles.ctrl}>
                            <span className={styles.ctrlButton}>
                                <SpeakerIcon />
                            </span>
                            <span className={styles.ctrlLabel}>Динамик</span>
                        </div>
                        <button type="button" className={styles.ctrl} onClick={endCall}>
                            <span className={`${styles.ctrlButton} ${styles.ctrlDanger}`}>
                                <HangUpIcon />
                            </span>
                            <span className={styles.ctrlLabel}>Сбросить</span>
                        </button>
                    </div>
                )}

                {isIncoming && (
                    <div className={styles.controls}>
                        <button type="button" className={styles.ctrl} onClick={() => void rejectCall()}>
                            <span className={`${styles.ctrlButton} ${styles.ctrlDanger}`}>
                                <HangUpIcon />
                            </span>
                            <span className={styles.ctrlLabel}>Отклонить</span>
                        </button>
                        <button type="button" className={styles.ctrl} onClick={() => void answerCall()}>
                            <span className={`${styles.ctrlButton} ${styles.ctrlAnswer}`}>
                                <HangUpIcon />
                            </span>
                            <span className={styles.ctrlLabel}>Ответить</span>
                        </button>
                    </div>
                )}

                {isFinished && (
                    <div className={styles.actions}>
                        <button
                            type="button"
                            className={styles.primaryBtn}
                            onClick={() => {
                                resetCallState();
                                onRetry();
                            }}
                        >
                            {error === 'microphone' ? 'Повторить попытку' : 'Позвонить ещё раз'}
                        </button>
                        <button
                            type="button"
                            className={styles.secondaryBtn}
                            onClick={() => {
                                close();
                                onWriteToChat();
                            }}
                        >
                            Написать в чат
                        </button>
                        {SUPPORT_PHONE_NUMBER && (
                            <a className={styles.phoneLink} href={`tel:${SUPPORT_PHONE_NUMBER}`}>
                                Или позвоните: {formatSupportPhone()}
                            </a>
                        )}
                        <button type="button" className={styles.closeLink} onClick={close}>
                            Закрыть
                        </button>
                    </div>
                )}
            </div>
            <span className={styles.srOnly} aria-hidden="true">{now}</span>
        </div>
    );
};

export default SupportCallModal;
