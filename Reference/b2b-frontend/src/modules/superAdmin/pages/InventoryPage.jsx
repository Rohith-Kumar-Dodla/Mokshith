import { Warehouse, Package } from 'lucide-react';

const InventoryPage = () => {
  return (
    <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
      <div className="text-center py-12">
        <div className="w-16 h-16 bg-teal-50 rounded-full flex items-center justify-center mx-auto mb-4">
          <Warehouse size={32} className="text-teal-600" />
        </div>
        <h2 className="text-xl font-bold text-gray-900 mb-2">Inventory</h2>
        <p className="text-gray-500">Manage inventory levels and stock</p>
      </div>
    </div>
  );
};

export default InventoryPage;
