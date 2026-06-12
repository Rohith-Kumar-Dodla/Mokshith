import PageHeader from '../../components/admin/PageHeader';
import AdminOrderManagement from '../../components/admin/AdminOrderManagement';

const Orders = () => (
  <AdminOrderManagement
    PageHeader={PageHeader}
    title="Area Orders"
    subtitle="Monitor and manage orders within your assigned area"
  />
);

export default Orders;
