import { ShoppingCart, Package } from 'lucide-react';

const OrdersPage = () => {
  return (
    <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
      <div className="text-center py-12">
        <div className="w-16 h-16 bg-orange-50 rounded-full flex items-center justify-center mx-auto mb-4">
          <ShoppingCart size={32} className="text-orange-600" />
        </div>
        <h2 className="text-xl font-bold text-gray-900 mb-2">Orders</h2>
        <p className="text-gray-500">Manage and track all orders</p>
      </div>
    </div>
  );
};

export default OrdersPage;
