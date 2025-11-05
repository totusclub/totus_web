import Steps from "@/components/searchPage/steps";
import SearchResult from "@/components/searchPage/searchResult";
import { useEffect, useState } from "react";
import { PackagesActualize, Packagesflights } from "@/api/levelTravelApi";
import { useRouter } from "next/router";

export default function Tickets() {
    const router = useRouter()
    const [allFlights, setAllFlights] = useState([]);
    const [packages, setPackages] = useState(null);
    const [flightsFilter, setFlightsFilter] = useState(null);
    const [packageId, setPackageId] = useState(null);
    const [loading, setLoading] = useState(false);


    useEffect(() => {
        if (router?.query?.package) {
            setLoading(true);
            PackagesActualize(router?.query?.package).then(e => {
                setPackages(e.package)
                const params = { package_id: e.package.id }
                setPackageId(e.package.id)
                requestFlights(params)
            }).catch(err => {
                console.error('Package loading failed:', err);
                setLoading(false);
            })
        }
    }, [router]);


    const requestFlights = async (paramsFlight) => {
        try {
            const f = await Packagesflights(paramsFlight);
            setAllFlights(f.flights);
            setFlightsFilter(f.filters);
        } catch (err) {
            console.error('Flights loading failed:', err);
        } finally {
            setLoading(false);
        }
    }

    const setFiltersRequest = (data) => {
        setLoading(true);
        const filterParams = { ...data, package_id: packageId }
        Packagesflights(filterParams).then((f) => {
            setAllFlights(f.flights);
            setFlightsFilter(f.filters);
            setLoading(false);
        }).catch(err => {
            console.error('Filter request failed:', err);
            setLoading(false);
        })
    }

    return (
        <main className={'searchContainer'}>

            <Steps active={3} />
            <SearchResult flightsFilter={flightsFilter} packages={packages} tickets={true} flights={allFlights} setFiltersRequest={setFiltersRequest} loading={loading} />
        </main>
    );
}
