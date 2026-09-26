import PageHeader from '../../components/admin/PageHeader';
import AdminOrderManagement from '../../components/admin/AdminOrderManagement';

const Orders = () => (
  <AdminOrderManagement
    PageHeader={PageHeader}
    title="Orders"
    subtitle="Monitor orders, payments and delivery operations"
    deliveryAssignmentPath="/admin/delivery-assignment"
  />
);

export default Orders;
