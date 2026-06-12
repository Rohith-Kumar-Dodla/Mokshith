import PageHeader from '../../components/superadmin/PageHeader';
import AdminOrderManagement from '../../components/admin/AdminOrderManagement';

const Orders = () => (
  <AdminOrderManagement
    PageHeader={PageHeader}
    title="Global Orders"
    subtitle="Manage all platform orders across regions"
  />
);

export default Orders;
