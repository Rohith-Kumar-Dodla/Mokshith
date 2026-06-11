import { Download, FileText } from 'lucide-react';

const LogsPage = () => {
  return (
    <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
      <div className="text-center py-12">
        <div className="w-16 h-16 bg-amber-50 rounded-full flex items-center justify-center mx-auto mb-4">
          <FileText size={32} className="text-amber-600" />
        </div>
        <h2 className="text-xl font-bold text-gray-900 mb-2">Export Logs</h2>
        <p className="text-gray-500">Export and download system logs and reports</p>
      </div>
    </div>
  );
};

export default LogsPage;
