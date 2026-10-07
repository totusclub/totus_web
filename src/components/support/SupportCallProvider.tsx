/**
 * Подключение звонка в поддержку к странице.
 *
 * Роль та же, что у `GlobalCallManager` в панели оператора: инициализирует
 * сервис для вошедшего пользователя и держит карточку звонка поверх любой
 * страницы, чтобы разговор переживал переходы по сайту.
 *
 * Доступность раздела повторяет приложение: звонок показывается только при
 * `access === 0`. Поле приходит из calling_api_v2 (в пользовательский JWT оно
 * не входит), поэтому запрашивается один раз после входа.
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
import { getVoipUser } from '@/api/supportCallApi';

// Звонок (WebRTC, lib/supportCall) и его карточка — отдельные чанки: грузятся только
// вошедшему пользователю с доступом к звонку, а не каждому посетителю.
const SupportCallModal = dynamic(() => import('./SupportCallModal'), { ssr: false });

type SupportCallModule = typeof import('@/lib/supportCall');
let supportCallModule: Promise<SupportCallModule> | null = null;
const loadSupportCall = () => {
    if (!supportCallModule) supportCallModule = import('@/lib/supportCall');
    return supportCallModule;
};

interface SupportCallContextValue {
    /** Показывать ли пункт «Звонок в поддержку». */
    available: boolean;
    /** Начать звонок. Ошибки уже отражены в карточке звонка. */
    call: () => void;
}

const SupportCallContext = createContext<SupportCallContextValue>({
    available: false,
    call: () => {},
});

export const useSupportCall = () => useContext(SupportCallContext);

const SupportCallProvider = ({ children }: { children: ReactNode }) => {
    const router = useRouter();
    const { user } = useAuth();
    const [available, setAvailable] = useState(false);

    const userId = user?.id;
    const loyaltyId = user?.loyalty_id ? String(user.loyalty_id) : '';

    useEffect(() => {
        let cancelled = false;

        if (!userId || !loyaltyId) {
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
            const profile = await getVoipUser(userId);
            if (cancelled) return;

            // Как в приложении: раздел скрыт, если доступ ограничен.
            const allowed = Number(profile?.access ?? 0) === 0;
            if (!allowed) {
                setAvailable(false);
                return;
            }
            const supportCall = await loadSupportCall();
            if (cancelled) return;
            supportCall.initSupportCall(loyaltyId);
            setAvailable(true);
        })().catch(() => undefined);

        return () => {
            cancelled = true;
        };
    }, [userId, loyaltyId]);

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

    const value = useMemo(() => ({ available, call }), [available, call]);

    return (
        <SupportCallContext.Provider value={value}>
            {children}
            {available && <SupportCallModal onWriteToChat={goToChat} onRetry={call} />}
        </SupportCallContext.Provider>
    );
};

export default SupportCallProvider;
