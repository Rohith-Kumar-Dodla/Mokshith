import PageHeader from '../../components/admin/PageHeader';
import SettingsPage from '../../components/settings/SettingsPage';
import WarehouseOriginPanel from '../../components/settings/WarehouseOriginPanel';

const AdminSettings = () => <div className="space-y-4"><SettingsPage PageHeader={PageHeader} role="admin" /><WarehouseOriginPanel /></div>;

export default AdminSettings;
