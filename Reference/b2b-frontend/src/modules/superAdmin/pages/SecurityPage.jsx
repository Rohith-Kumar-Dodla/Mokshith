import { Shield, Lock, Key, AlertTriangle } from 'lucide-react';

const SecurityPage = () => {
  return (
    <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
      <div className="text-center py-12">
        <div className="w-16 h-16 bg-purple-50 rounded-full flex items-center justify-center mx-auto mb-4">
          <Shield size={32} className="text-purple-600" />
        </div>
        <h2 className="text-xl font-bold text-gray-900 mb-2">Security Panel</h2>
        <p className="text-gray-500">Manage platform security settings and configurations</p>
      </div>
    </div>
  );
};

export default SecurityPage;
