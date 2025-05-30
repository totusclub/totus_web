import Steps from "@/components/searchPage/steps";
import SearchResult from "@/components/searchPage/searchResult";

export default function Tickets() {
    return (
        <main className={'searchContainer'}>
            <Steps active={3}/>
            <SearchResult tickets={true}/>
        </main>
    );
}
