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
import useAuth from '@/hooks/useAuth';
import { getVoipUser } from '@/api/supportCallApi';
import { callSupport, initSupportCall, shutdownSupportCall } from '@/lib/supportCall';
import SupportCallModal from './SupportCallModal';

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
            shutdownSupportCall();
            return () => {
                cancelled = true;
            };
        }

        (async () => {
            const profile = await getVoipUser(userId);
            if (cancelled) return;

            // Как в приложении: раздел скрыт, если доступ ограничен.
            const allowed = Number(profile?.access ?? 0) === 0;
            setAvailable(allowed);
            if (allowed) initSupportCall(loyaltyId);
        })();

        return () => {
            cancelled = true;
        };
    }, [userId, loyaltyId]);

    const call = useCallback(() => {
        void callSupport().catch(() => {
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
