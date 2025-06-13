import Steps from "@/components/searchPage/steps";
import SearchResult from "@/components/searchPage/searchResult";
import {useEffect, useState} from "react";
import {PackagesActualize, Packagesflights} from "@/api/levelTravelApi";
import {router} from "next/client";

export default function Tickets() {
const [allFlights,setAllFlights] = useState([]);
const [packages,setPackages] = useState(null);

    useEffect(() => {
        if (router?.query?.package) {
            PackagesActualize(router?.query?.package).then(e=>{
                console.log('changes',e.changes);
                setPackages(e.package)
                let paramsFlight = {package_id:e.package.id}
                Packagesflights(paramsFlight).then((f)=>{
                    console.log('Packagesflights....',f.flights)
                    setAllFlights(f.flights);

                })
            })


        }
    }, [router?.query?.package]);

    return (
        <main className={'searchContainer'}>
            <Steps active={3}/>
            <SearchResult packages={packages} tickets={true} flights={allFlights} />
        </main>
    );
}
