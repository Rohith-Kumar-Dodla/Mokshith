import PageHeader from '../../components/superadmin/PageHeader';
import SettingsPage from '../../components/settings/SettingsPage';
import useViewport from '../../hooks/useViewport';
import WarehouseOriginPanel from '../../components/settings/WarehouseOriginPanel';

const SuperAdminSettings = () => {
  const { isMobile } = useViewport();
  return (
    <div className={isMobile ? 'space-y-4' : ''}>
      <PageHeader title="Settings" subtitle="Super Admin configuration" />
      <div className={isMobile ? 'p-3' : ''}>
        <SettingsPage PageHeader={PageHeader} role="super-admin" />
        <WarehouseOriginPanel />
      </div>
    </div>
  );
};

export default SuperAdminSettings;
