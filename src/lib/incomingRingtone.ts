/**
 * Звук входящего звонка и мигание вкладки (сайт totus_WEB и панель оператора calling_v2 — один и тот же файл).
 *
 * Звук синтезируется в браузере (Web Audio): классический двухтональный звонок
 * 440 + 480 Гц, 1,2 с звук / 2 с пауза, до ответа, отклонения или отбоя.
 * Файлов и лицензий нет.
 *
 * Автовоспроизведение: браузер разрешает звук только после действия пользователя
 * на странице. Поэтому общий AudioContext создаётся и «размораживается» при первом
 * нажатии / клавише (installAudioUnlock). Если звук всё же заблокирован —
 * звонок не падает: остаётся карточка и мигающая вкладка.
 *
 * startIncomingRingtone() идемпотентна: повторный вызов, пока звонит, ничего не делает.
 * Страховка: через RING_MAX_MS звук и мигание останавливаются сами.
 */

const TONE_HZ = [440, 480];
const RING_ON_MS = 1200;
const RING_OFF_MS = 2000;
const RING_GAIN = 0.12;
const FADE_S = 0.02;
const RING_MAX_MS = 65_000;
const BLINK_MS = 1000;
const BLINK_TITLE = '📞 Входящий звонок';

type AudioContextCtor = typeof AudioContext;

let ctx: AudioContext | null = null;
let unlockInstalled = false;
let ringing = false;
let ringTimer: ReturnType<typeof setInterval> | null = null;
let maxTimer: ReturnType<typeof setTimeout> | null = null;
let blinkTimer: ReturnType<typeof setInterval> | null = null;
let savedTitle: string | null = null;
let activeNodes: { osc: OscillatorNode[]; gain: GainNode }[] = [];

function audioContextCtor(): AudioContextCtor | null {
    if (typeof window === 'undefined') return null;
    const w = window as unknown as { AudioContext?: AudioContextCtor; webkitAudioContext?: AudioContextCtor };
    return w.AudioContext || w.webkitAudioContext || null;
}

function getContext(): AudioContext | null {
    if (ctx) return ctx;
    const Ctor = audioContextCtor();
    if (!Ctor) return null;
    try {
        ctx = new Ctor();
    } catch {
        ctx = null;
    }
    return ctx;
}

/** Разблокировать звук при первом действии пользователя (один раз на страницу). */
export function installAudioUnlock(): void {
    if (unlockInstalled || typeof window === 'undefined') return;
    unlockInstalled = true;
    const unlock = () => {
        const c = getContext();
        if (c && c.state === 'suspended') void c.resume().catch(() => undefined);
    };
    for (const ev of ['pointerdown', 'keydown', 'touchend'] as const) {
        window.addEventListener(ev, unlock, { capture: true, passive: true });
    }
}

function playBurst(): void {
    const c = getContext();
    if (!c) return;
    if (c.state === 'suspended') void c.resume().catch(() => undefined);
    try {
        const t0 = c.currentTime + 0.01;
        const t1 = t0 + RING_ON_MS / 1000;
        const gain = c.createGain();
        gain.gain.setValueAtTime(0, t0);
        gain.gain.linearRampToValueAtTime(RING_GAIN, t0 + FADE_S);
        gain.gain.setValueAtTime(RING_GAIN, t1 - FADE_S);
        gain.gain.linearRampToValueAtTime(0, t1);
        gain.connect(c.destination);
        const osc = TONE_HZ.map((hz) => {
            const o = c.createOscillator();
            o.type = 'sine';
            o.frequency.value = hz;
            o.connect(gain);
            o.start(t0);
            o.stop(t1 + 0.05);
            return o;
        });
        const entry = { osc, gain };
        activeNodes.push(entry);
        osc[0].onended = () => {
            try {
                gain.disconnect();
            } catch {
                /* уже отключён */
            }
            activeNodes = activeNodes.filter((n) => n !== entry);
        };
    } catch {
        // автовоспроизведение запрещено или Web Audio недоступен — молча, звонок идёт дальше
    }
}

function silenceNow(): void {
    for (const { osc, gain } of activeNodes) {
        for (const o of osc) {
            try {
                o.stop();
            } catch {
                /* уже остановлен */
            }
        }
        try {
            gain.disconnect();
        } catch {
            /* уже отключён */
        }
    }
    activeNodes = [];
}

function startBlink(): void {
    if (typeof document === 'undefined' || blinkTimer) return;
    savedTitle = document.title;
    let on = false;
    blinkTimer = setInterval(() => {
        // Заголовок мог поменять кто-то другой (счётчик чата) — запоминаем новый
        if (document.title !== BLINK_TITLE) savedTitle = document.title;
        on = !on;
        document.title = on ? BLINK_TITLE : savedTitle ?? '';
    }, BLINK_MS);
}

function stopBlink(): void {
    if (blinkTimer) clearInterval(blinkTimer);
    blinkTimer = null;
    if (typeof document !== 'undefined' && savedTitle !== null && document.title === BLINK_TITLE) {
        document.title = savedTitle;
    }
    savedTitle = null;
}

/** Начать звонок (звук + мигание вкладки). Повторный вызов во время звонка ничего не делает. */
export function startIncomingRingtone(): void {
    if (ringing || typeof window === 'undefined') return;
    ringing = true;
    installAudioUnlock();
    playBurst();
    ringTimer = setInterval(playBurst, RING_ON_MS + RING_OFF_MS);
    maxTimer = setTimeout(stopIncomingRingtone, RING_MAX_MS);
    startBlink();
}

/** Остановить звук и мигание (ответ, отклонение, отбой, выход). Безопасно вызывать всегда. */
export function stopIncomingRingtone(): void {
    if (ringTimer) clearInterval(ringTimer);
    if (maxTimer) clearTimeout(maxTimer);
    ringTimer = null;
    maxTimer = null;
    if (ringing) silenceNow();
    ringing = false;
    stopBlink();
}

export function isIncomingRingtonePlaying(): boolean {
    return ringing;
}
