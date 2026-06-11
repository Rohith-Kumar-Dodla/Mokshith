import { Package, Box } from 'lucide-react';

const ProductsPage = () => {
  return (
    <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
      <div className="text-center py-12">
        <div className="w-16 h-16 bg-indigo-50 rounded-full flex items-center justify-center mx-auto mb-4">
          <Package size={32} className="text-indigo-600" />
        </div>
        <h2 className="text-xl font-bold text-gray-900 mb-2">Products</h2>
        <p className="text-gray-500">Manage product catalog and inventory</p>
      </div>
    </div>
  );
};

export default ProductsPage;
