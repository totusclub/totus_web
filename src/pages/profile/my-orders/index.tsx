import withAuth from '@/utils/withAuth';
import OrderList from '@/components/profile/orderList';

const MyOrders = () => {
  return (
    <main className={'searchContainer'}>
      <div className={'content row'}>
        <OrderList show variant="mobile" />
      </div>
    </main>
  );
};

export default withAuth(MyOrders);
