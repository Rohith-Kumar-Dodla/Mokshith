import { useSuperAdmin } from "../hooks/useSuperAdmin";
import SystemConfigForm from "../components/SystemConfigForm.jsx";

const ConfigurationPage = () => {
  const { 
    config, 
    updateConfig 
  } = useSuperAdmin();

  return (
    <div className="space-y-6">
      <SystemConfigForm config={config} onSave={updateConfig} />
    </div>
  );
};

export default ConfigurationPage;
