/**
 * Подключение звонка в поддержку к странице.
 *
 * Роль та же, что у `GlobalCallManager` в панели оператора: инициализирует
 * сервис для вошедшего пользователя и держит карточку звонка поверх любой
 * страницы, чтобы разговор переживал переходы по сайту.
 *
 * Доступ к Calling и Маше — как в приложении (totus_APP): переключатель «Доступ» в Calling Admin
 * (`users.access`). Поле приходит из calling_api_v2 (в пользовательский JWT оно не входит),
 * поэтому запрашивается один раз после входа.
 *  - «Доступ»: в профиле «Чат с поддержкой» и «Звонок в поддержку», на сайте — Маша;
 *  - «Заблок.»: ничего из этого не показывается;
 *  - профиль не получен (сеть, ошибка): Calling скрыт, Маша показывается — как в приложении
 *    (Account.tsx скрывает раздел, вкладка Totus AI в authStack.tsx остаётся).
 */
import {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useMemo,
    useState,
    type ReactNode,
} from 'react';
import { useRouter } from 'next/router';
import dynamic from 'next/dynamic';
import useAuth from '@/hooks/useAuth';
import { getVoipUser, hasCallingAccess } from '@/api/supportCallApi';

// Звонок (WebRTC, lib/supportCall) и его карточка — отдельные чанки: грузятся только
// вошедшему пользователю с доступом к звонку, а не каждому посетителю.
const SupportCallModal = dynamic(() => import('./SupportCallModal'), { ssr: false });

type SupportCallModule = typeof import('@/lib/supportCall');
let supportCallModule: Promise<SupportCallModule> | null = null;
const loadSupportCall = () => {
    if (!supportCallModule) supportCallModule = import('@/lib/supportCall');
    return supportCallModule;
};

/**
 * none — не вошёл; loading — ждём calling_api_v2; allowed — «Доступ»; denied — «Заблок.»;
 * unknown — профиль не получен.
 */
export type CallingAccessState = 'none' | 'loading' | 'allowed' | 'denied' | 'unknown';

interface SupportCallContextValue {
    /** Показывать ли пункт «Звонок в поддержку». */
    available: boolean;
    /** Начать звонок. Ошибки уже отражены в карточке звонка. */
    call: () => void;
    /** Calling в профиле: «Чат с поддержкой», «Звонок в поддержку». */
    callingAllowed: boolean;
    /** Маша (кнопка и чат). */
    milaAllowed: boolean;
}

const SupportCallContext = createContext<SupportCallContextValue>({
    available: false,
    call: () => {},
    callingAllowed: false,
    milaAllowed: false,
});

export const useSupportCall = () => useContext(SupportCallContext);

/** Calling виден при «Доступ». Загрузка и ошибка — скрыт. */
export const isCallingVisible = (state: CallingAccessState) => state === 'allowed';
/** Маша видна при «Доступ» и когда профиль не получен (как вкладка Totus AI в приложении). */
export const isMilaVisible = (state: CallingAccessState) => state === 'allowed' || state === 'unknown';

/** Рендерит детей только при доступе к Calling (сокет и счётчик чата поддержки). */
export const CallingOnly = ({ children }: { children: ReactNode }) => {
    const { callingAllowed } = useSupportCall();
    return callingAllowed ? <>{children}</> : null;
};

const SupportCallProvider = ({ children }: { children: ReactNode }) => {
    const router = useRouter();
    const { user } = useAuth();
    const [available, setAvailable] = useState(false);
    const [accessState, setAccessState] = useState<CallingAccessState>('none');

    const userId = user?.id;
    const loyaltyId = user?.loyalty_id ? String(user.loyalty_id) : '';

    // 1) Доступ из Calling Admin — один запрос на пользователя (смена loyalty_id из /api/auth/me не перезапрашивает).
    useEffect(() => {
        let cancelled = false;

        if (!userId) {
            setAccessState('none');
            return () => {
                cancelled = true;
            };
        }

        setAccessState('loading');
        void getVoipUser(userId).then((profile) => {
            if (cancelled) return;
            // Как в приложении: Calling и Маша — только при «Доступ» в Calling Admin.
            setAccessState(!profile ? 'unknown' : hasCallingAccess(profile.access) ? 'allowed' : 'denied');
        });

        return () => {
            cancelled = true;
        };
    }, [userId]);

    // 2) Звонок в поддержку — только при «Доступ»; выход, «Заблок.», смена пользователя — сервис останавливается.
    useEffect(() => {
        let cancelled = false;

        if (accessState !== 'allowed' || !loyaltyId) {
            setAvailable(false);
            // Модуль звонка ещё не загружался — останавливать нечего.
            if (supportCallModule) {
                void supportCallModule.then((m) => m.shutdownSupportCall()).catch(() => undefined);
            }
            return () => {
                cancelled = true;
            };
        }

        (async () => {
            const supportCall = await loadSupportCall();
            if (cancelled) return;
            supportCall.initSupportCall(loyaltyId);
            setAvailable(true);
        })().catch(() => undefined);

        return () => {
            cancelled = true;
        };
    }, [accessState, loyaltyId]);

    const call = useCallback(() => {
        void loadSupportCall()
            .then((m) => m.callSupport())
            .catch(() => {
                // причина уже записана в состояние звонка и показана в карточке
            });
    }, []);

    const goToChat = useCallback(() => {
        void router.push('/profile/support-chat');
    }, [router]);

    const value = useMemo(
        () => ({
            available,
            call,
            callingAllowed: isCallingVisible(accessState),
            milaAllowed: isMilaVisible(accessState),
        }),
        [available, call, accessState],
    );

    return (
        <SupportCallContext.Provider value={value}>
            {children}
            {available && <SupportCallModal onWriteToChat={goToChat} onRetry={call} />}
        </SupportCallContext.Provider>
    );
};

export default SupportCallProvider;
