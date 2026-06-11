import { TrendingUp, DollarSign } from 'lucide-react';

const RevenuePage = () => {
  return (
    <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
      <div className="text-center py-12">
        <div className="w-16 h-16 bg-cyan-50 rounded-full flex items-center justify-center mx-auto mb-4">
          <TrendingUp size={32} className="text-cyan-600" />
        </div>
        <h2 className="text-xl font-bold text-gray-900 mb-2">Revenue Analytics</h2>
        <p className="text-gray-500">View revenue analytics and reports</p>
      </div>
    </div>
  );
};

export default RevenuePage;
