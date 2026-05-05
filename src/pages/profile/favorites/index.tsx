import MenuProfile from "@/components/profile/menu";
import FavoritesList from "@/components/favorites/FavoritesList";
import withAuth from "@/utils/withAuth";

function FavoritesPage() {
    return (
        <main className={"searchContainer"}>
            <div className={"content row"}>
                <MenuProfile />
                <FavoritesList />
            </div>
        </main>
    );
}

export default withAuth(FavoritesPage);
