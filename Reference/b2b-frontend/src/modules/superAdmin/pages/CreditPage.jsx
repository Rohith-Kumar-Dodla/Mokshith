import { CreditCard, DollarSign } from 'lucide-react';

const CreditPage = () => {
  return (
    <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
      <div className="text-center py-12">
        <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-4">
          <CreditCard size={32} className="text-green-600" />
        </div>
        <h2 className="text-xl font-bold text-gray-900 mb-2">Credit Management</h2>
        <p className="text-gray-500">Manage credit limits and payments</p>
      </div>
    </div>
  );
};

export default CreditPage;
