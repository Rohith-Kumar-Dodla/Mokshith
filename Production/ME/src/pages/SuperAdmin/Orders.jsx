import AdminOrderManagement from '../../components/admin/AdminOrderManagement';
import PageHeader from '../../components/superadmin/PageHeader';

const Orders = () => (
  <AdminOrderManagement
    PageHeader={PageHeader}
    title="Global Orders"
    subtitle="Monitor orders, payments and delivery operations across the platform"
    deliveryAssignmentPath="/super-admin/delivery-assignment"
    useLegacyProcurementPanel={false}
  />
);

export default Orders;
