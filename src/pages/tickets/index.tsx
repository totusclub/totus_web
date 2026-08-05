import Steps from "@/components/searchPage/steps";
import SearchResult from "@/components/searchPage/searchResult";
import { useCallback, useEffect, useState } from "react";
import { PackagesActualize, Packagesflights } from "@/api/levelTravelApi";
import { useRouter } from "next/router";
import axios from "axios";

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

    const packageQuery = Array.isArray(router.query.package)
        ? router.query.package[0]
        : router.query.package;

    const requestFlights = useCallback(async (
        paramsFlight: Record<string, unknown>,
        options?: { allowRetry?: boolean },
    ) => {
        const allowRetry = options?.allowRetry !== false;
        try {
            setError(null);
            const f = await Packagesflights(paramsFlight);
            setAllFlights(f.flights || []);
            setFlightsFilter(f.filters || null);
            return f;
        } catch (err) {
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
            setError('Не удалось загрузить варианты перелёта. Попробуйте выбрать тур заново.');
            throw err;
        } finally {
            setLoading(false);
        }
    }, [packageQuery]);

    useEffect(() => {
        if (!router.isReady || !packageQuery) return;

        let cancelled = false;
        setLoading(true);
        setError(null);

        PackagesActualize(packageQuery as never)
            .then((e) => {
                if (cancelled) return;
                const id = e?.package?.id;
                if (!id) {
                    throw new Error('Package actualize returned no package.id');
                }
                setPackages(e.package);
                setPackageId(id);
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

    const setFiltersRequest = (data: Record<string, unknown>) => {
        if (!packageId) return;
        setLoading(true);
        const filterParams = {
            ...pickActiveFlightFilters(data),
            package_id: packageId,
        };
        requestFlights(filterParams).catch(() => {
            /* error state already set */
        });
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
