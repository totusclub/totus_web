import MenuProfile from "@/components/profile/menu";
import OrderList from "@/components/profile/orderList";
import withAuth from "@/utils/withAuth";


const Profile = ()=> {
    return (
        <main className={'searchContainer'}>
            <div className={'content row'}>
                <MenuProfile/>
                <OrderList show variant="desktop" />
            </div>
        </main>
    );
}
export default withAuth(Profile);
