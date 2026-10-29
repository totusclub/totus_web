import Steps from "@/components/searchPage/steps";
import SearchResult from "@/components/searchPage/searchResult";
import { useCallback, useEffect, useRef, useState } from "react";
import { PackagesActualize, Packagesflights } from "@/api/levelTravelApi";
import { useRouter } from "next/router";
import axios from "axios";
import useAuth from "@/hooks/useAuth";
import AuthModal from "@/components/auth/LazyAuthModal";
import bookingStyles from "@/components/bookingPage/booking.module.css";
import { BookingNoFlights } from "@/components/bookingPage/bookingStatus";
import {
    getNoFlightBookingHref,
    getOfferSummary,
    isFlightsFailedError,
    isNoFlightsPayload,
    readBookingReturnUrl,
} from "@/utils/bookingOffer";
import { formatMoneyRub, getBookingPriceBreakdown } from "@/utils/packagePrice";

function pickActiveFlightFilters(data: Record<string, unknown> | null | undefined) {
    if (!data || typeof data !== 'object') return {};
    const out: Record<string, unknown> = {};

    for (const [key, value] of Object.entries(data)) {
        if (key === 'package_id' || key === 'packageId') continue;
        if (value == null) continue;
        if (Array.isArray(value)) {
            if (value.length > 0) out[key] = value;
            continue;
        }
        if (typeof value === 'object') {
            const vals = Object.values(value as Record<string, unknown>);
            if (vals.length === 0) continue;
            if (vals.every((v) => v == null || v === '')) continue;
            out[key] = value;
            continue;
        }
        out[key] = value;
    }

    return out;
}

/** Пауза перед запросом при переключении фильтров: несколько быстрых кликов — один запрос к API. */
const FLIGHTS_FILTERS_DEBOUNCE_MS = 400;

function isAbortError(err: unknown): boolean {
    return axios.isCancel(err) || (err as { name?: string } | null)?.name === 'CanceledError';
}

function isPackageGoneError(err: unknown): boolean {
    if (!axios.isAxiosError(err)) return false;
    const status = err.response?.status;
    if (status !== 400 && status !== 404 && status !== 422) return false;
    const data = err.response?.data as { error?: string; errors?: unknown } | undefined;
    const msg = String(data?.error || '').toLowerCase();
    return (
        msg.includes('package not found') ||
        msg.includes('invalid_params') ||
        msg.includes('package')
    );
}

export default function Tickets() {
    const router = useRouter()
    const [allFlights, setAllFlights] = useState([]);
    const [packages, setPackages] = useState(null);
    const [flightsFilter, setFlightsFilter] = useState(null);
    const [packageId, setPackageId] = useState<number | string | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    /**
     * Перелётов к туру нет (actualize: «No flights available…» или flights_failed без фильтров):
     * вместо списка — «Продолжить без перелёта» (макет «Тур без перелёта», 29.10.2026).
     */
    const [noFlights, setNoFlights] = useState(false);
    const [roomsHref, setRoomsHref] = useState<string | null>(null);
    const [authModal, setAuthModal] = useState(false);
    const { token } = useAuth();

    const packageQuery = Array.isArray(router.query.package)
        ? router.query.package[0]
        : router.query.package;

    // Только последний запрос перелётов имеет значение: предыдущий отменяется,
    // а его ответ (если всё же пришёл) не перетирает новый список.
    const requestSeqRef = useRef(0);
    const abortRef = useRef<AbortController | null>(null);
    const filtersTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    useEffect(() => () => {
        if (filtersTimerRef.current) clearTimeout(filtersTimerRef.current);
        abortRef.current?.abort();
    }, []);

    const requestFlights = useCallback(async (
        paramsFlight: Record<string, unknown>,
        options?: { allowRetry?: boolean },
    ) => {
        const allowRetry = options?.allowRetry !== false;
        abortRef.current?.abort();
        const controller = new AbortController();
        abortRef.current = controller;
        const seq = ++requestSeqRef.current;
        const isCurrent = () => seq === requestSeqRef.current;
        try {
            setError(null);
            setNoFlights(false);
            // view: 'list' — лёгкий ответ API (только поля, которые показывает страница билетов)
            const f = await Packagesflights(paramsFlight, { view: 'list', signal: controller.signal });
            if (!isCurrent()) return f;
            setAllFlights(f.flights || []);
            setFlightsFilter(f.filters || null);
            return f;
        } catch (err) {
            // Запрос отменён новым (фильтр переключили ещё раз) — это не ошибка.
            if (!isCurrent() || isAbortError(err)) return undefined;
            console.error('Flights loading failed:', err);

            // Expired / stale package → actualize once and retry with fresh id.
            if (allowRetry && isPackageGoneError(err)) {
                const staleId = paramsFlight.package_id ?? packageQuery;
                if (staleId != null && staleId !== '') {
                    try {
                        const refreshed = await PackagesActualize(staleId as never);
                        const freshId = refreshed?.package?.id;
                        if (freshId != null) {
                            setPackages(refreshed.package);
                            setPackageId(freshId);
                            return await requestFlights(
                                { ...paramsFlight, package_id: freshId },
                                { allowRetry: false },
                            );
                        }
                    } catch (retryErr) {
                        console.error('Flights retry after actualize failed:', retryErr);
                    }
                }
            }

            setAllFlights([]);
            setFlightsFilter(null);
            // Level.Travel не нашёл рейсов к пакету (запрос без фильтров) — тур можно взять без перелёта.
            const withoutFilters = Object.keys(paramsFlight).every((key) => key === 'package_id');
            if (withoutFilters && isFlightsFailedError(err)) {
                setNoFlights(true);
                return undefined;
            }
            setError('Не удалось загрузить варианты перелёта. Попробуйте выбрать тур заново.');
            throw err;
        } finally {
            if (isCurrent()) setLoading(false);
        }
    }, [packageQuery]);

    useEffect(() => {
        if (!router.isReady || !packageQuery) return;

        let cancelled = false;
        setLoading(true);
        setError(null);
        setNoFlights(false);

        PackagesActualize(packageQuery as never)
            .then((e) => {
                if (cancelled) return;
                const id = e?.package?.id;
                if (!id) {
                    throw new Error('Package actualize returned no package.id');
                }
                setPackages(e.package);
                setPackageId(id);
                if (isNoFlightsPayload(e)) {
                    setNoFlights(true);
                    setLoading(false);
                    return;
                }
                return requestFlights({ package_id: id });
            })
            .catch((err) => {
                console.error('Package loading failed:', err);
                if (!cancelled) {
                    setLoading(false);
                    setError('Не удалось загрузить пакет. Вернитесь к выбору номера.');
                }
            });

        return () => {
            cancelled = true;
        };
    }, [router.isReady, packageQuery, requestFlights]);

    // Страница отеля, с которой пришли («Вернуться к номерам»).
    useEffect(() => {
        setRoomsHref(readBookingReturnUrl());
    }, []);

    const continueWithoutFlight = () => {
        const href = getNoFlightBookingHref(packageId ?? packageQuery);
        if (!href) return;
        // Как «Выбрать» у рейса: оформление — после входа.
        if (!token) {
            setAuthModal(true);
            return;
        }
        router.push(href);
    };

    const setFiltersRequest = (data: Record<string, unknown>) => {
        if (!packageId) return;
        setLoading(true);
        const filterParams = {
            ...pickActiveFlightFilters(data),
            package_id: packageId,
        };
        // Несколько быстрых кликов по фильтрам → один запрос с последним набором фильтров.
        if (filtersTimerRef.current) clearTimeout(filtersTimerRef.current);
        filtersTimerRef.current = setTimeout(() => {
            filtersTimerRef.current = null;
            requestFlights(filterParams).catch(() => {
                /* error state already set */
            });
        }, FLIGHTS_FILTERS_DEBOUNCE_MS);
    }

    if (noFlights && !loading) {
        const { totalPrice } = getBookingPriceBreakdown(
            packages ? { ...(packages as Record<string, unknown>), predicted_surcharge: 0 } : null,
        );
        return (
            <main className={'searchContainer'}>
                <Steps activeStep="flights" searchType="package" />
                <div className={'content'}>
                    <div className={`${bookingStyles.bookingScreen} ${bookingStyles.bookingScreenCenter}`}>
                        <BookingNoFlights
                            summary={getOfferSummary(packages)}
                            priceText={totalPrice > 0 ? formatMoneyRub(totalPrice) : undefined}
                            onContinue={continueWithoutFlight}
                            roomsHref={roomsHref}
                        />
                    </div>
                </div>
                <AuthModal open={authModal} setOpen={setAuthModal} />
            </main>
        );
    }

    return (
        <main className={'searchContainer'}>

            <Steps activeStep="flights" searchType="package" />
            {error && !loading && (
                <div className={'content'} style={{ padding: '16px 0', color: 'var(--textPrimary)' }}>
                    <p>{error}</p>
                </div>
            )}
            <SearchResult flightsFilter={flightsFilter} packages={packages} tickets={true} flights={allFlights} setFiltersRequest={setFiltersRequest} loading={loading} />
        </main>
    );
}
