import Steps from "@/components/searchPage/steps";
import SearchResult from "@/components/searchPage/searchResult";
import { useCallback, useEffect, useState } from "react";
import { PackagesActualize, Packagesflights } from "@/api/levelTravelApi";
import { useRouter } from "next/router";

export default function Tickets() {
    const router = useRouter()
    const [allFlights, setAllFlights] = useState([]);
    const [packages, setPackages] = useState(null);
    const [flightsFilter, setFlightsFilter] = useState(null);
    const [packageId, setPackageId] = useState(null);
    const [loading, setLoading] = useState(false);

    const packageQuery = Array.isArray(router.query.package)
        ? router.query.package[0]
        : router.query.package;

    const requestFlights = useCallback(async (paramsFlight: Record<string, unknown>) => {
        try {
            const f = await Packagesflights(paramsFlight);
            setAllFlights(f.flights || []);
            setFlightsFilter(f.filters || null);
        } catch (err) {
            console.error('Flights loading failed:', err);
            setAllFlights([]);
            setFlightsFilter(null);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        if (!router.isReady || !packageQuery) return;

        let cancelled = false;
        setLoading(true);

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
                if (!cancelled) setLoading(false);
            });

        return () => {
            cancelled = true;
        };
    }, [router.isReady, packageQuery, requestFlights]);

    const setFiltersRequest = (data: Record<string, unknown>) => {
        if (!packageId) return;
        setLoading(true);
        const filterParams = { ...data, package_id: packageId };
        requestFlights(filterParams);
    }

    return (
        <main className={'searchContainer'}>

            <Steps activeStep="flights" searchType="package" />
            <SearchResult flightsFilter={flightsFilter} packages={packages} tickets={true} flights={allFlights} setFiltersRequest={setFiltersRequest} loading={loading} />
        </main>
    );
}
