import { Settings, Cog } from 'lucide-react';

const SettingsPage = () => {
  return (
    <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
      <div className="text-center py-12">
        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <Settings size={32} className="text-gray-600" />
        </div>
        <h2 className="text-xl font-bold text-gray-900 mb-2">Platform Settings</h2>
        <p className="text-gray-500">Configure platform-wide settings</p>
      </div>
    </div>
  );
};

export default SettingsPage;
