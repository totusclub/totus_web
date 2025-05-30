import Steps from "@/components/searchPage/steps";
import SearchResult from "@/components/searchPage/searchResult";

export default function Search() {
    return (
        <main className={'searchContainer'}>
            <Steps active={1}/>
            <SearchResult/>
        </main>
    );
}
