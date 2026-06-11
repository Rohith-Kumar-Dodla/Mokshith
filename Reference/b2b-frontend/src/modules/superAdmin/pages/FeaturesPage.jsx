import { useSuperAdmin } from "../hooks/useSuperAdmin";
import FeatureAndSecurityPanel from "../components/FeatureAndSecurityPanel.jsx";

const FeaturesPage = () => {
  const { 
    config, 
    updateConfig 
  } = useSuperAdmin();

  return (
    <div className="space-y-6">
      <FeatureAndSecurityPanel config={config} onSave={updateConfig} />
    </div>
  );
};

export default FeaturesPage;
