import Steps from "@/components/searchPage/steps";
import SearchResult from "@/components/searchPage/searchResult";
import {useEffect, useState} from "react";
import {PackagesActualize, Packagesflights} from "@/api/levelTravelApi";
import {useRouter} from "next/router";

export default function Tickets() {
    const router = useRouter()
const [allFlights,setAllFlights] = useState([]);
const [packages,setPackages] = useState(null);
const [flightsFilter,setFlightsFilter] = useState(null);
const [packageId, setPackageId] = useState(null);

    useEffect(() => {
        if (router?.query?.package) {
            PackagesActualize(router?.query?.package).then(e=>{
                setPackages(e.package)
                const params = {package_id:e.package.id}
                setPackageId(e.package.id)
                requestFlights(params)
            })
        }
    }, [router]);


    const requestFlights = async (paramsFlight) => {
        Packagesflights(paramsFlight).then((f)=>{
            setAllFlights(f.flights);
            setFlightsFilter(f.filters)
        })
    }

    const setFiltersRequest =  (data)=>{
        const filterParams = {...data,package_id:packageId}
        Packagesflights(filterParams).then((f)=>{
            setAllFlights(f.flights);
            setFlightsFilter(f.filters)
        })
    }

    return (
        <main className={'searchContainer'}>
            <Steps active={3}/>
            <SearchResult flightsFilter={flightsFilter} packages={packages} tickets={true} flights={allFlights} setFiltersRequest={setFiltersRequest} />
        </main>
    );
}
