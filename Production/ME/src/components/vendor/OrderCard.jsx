import React from 'react';
import { FiEye, FiTruck, FiPackage, FiClock } from 'react-icons/fi';

const OrderCard = ({ order, onViewDetails }) => {
  const getStatusColor = (status) => {
    switch (status) {
      case 'delivered':
        return 'bg-green-100 text-green-800';
      case 'dispatched':
        return 'bg-blue-100 text-blue-800';
      case 'processing':
        return 'bg-yellow-100 text-yellow-800';
      case 'confirmed':
        return 'bg-indigo-100 text-indigo-800';
      case 'pending':
        return 'bg-gray-100 text-gray-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'delivered':
        return <FiPackage className="w-4 h-4" />;
      case 'dispatched':
        return <FiTruck className="w-4 h-4" />;
      case 'processing':
        return <FiClock className="w-4 h-4" />;
      default:
        return <FiPackage className="w-4 h-4" />;
    }
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-3 sm:p-4 hover:shadow-md transition-shadow">
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2 sm:gap-4 mb-3 sm:mb-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-semibold text-sm sm:text-base text-gray-900">{order.id}</h3>
            <span className={`px-2 py-1 text-xs font-semibold rounded-full flex items-center gap-1 ${getStatusColor(order.status)}`}>
              {getStatusIcon(order.status)}
              {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
            </span>
          </div>
          <p className="text-xs sm:text-sm text-gray-500">
            {order.items.length} {order.items.length === 1 ? 'item' : 'items'} • Placed on {order.orderDate}
          </p>
        </div>
        <button
          onClick={() => onViewDetails && onViewDetails(order)}
          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors min-h-[40px] min-w-[40px] flex items-center justify-center"
          title="View Details"
        >
          <FiEye className="w-4 h-4 sm:w-5 sm:h-5" />
        </button>
      </div>

      {/* Order Items Preview */}
      <div className="mb-3 sm:mb-4">
        <div className="flex flex-wrap gap-1.5 sm:gap-2">
          {order.items.slice(0, 3).map((item, index) => (
            <span
              key={index}
              className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-md"
            >
              {item.productName}
            </span>
          ))}
          {order.items.length > 3 && (
            <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-md">
              +{order.items.length - 3} more
            </span>
          )}
        </div>
      </div>

      {/* Amount and Delivery Info */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-4 pt-3 sm:pt-4 border-t border-gray-100">
        <div>
          <p className="text-xs sm:text-sm text-gray-500">Total Amount</p>
          <p className="text-base sm:text-lg font-bold text-gray-900">₹{order.amount.toFixed(2)}</p>
        </div>
        <div className="text-right">
          {order.status === 'delivered' ? (
            <>
              <p className="text-xs sm:text-sm text-gray-500">Delivered on</p>
              <p className="text-xs sm:text-sm font-medium text-gray-900">{order.deliveryDate}</p>
            </>
          ) : (
            <>
              <p className="text-xs sm:text-sm text-gray-500">Estimated Delivery</p>
              <p className="text-xs sm:text-sm font-medium text-gray-900">{order.estimatedDelivery}</p>
            </>
          )}
        </div>
      </div>

      {/* Delivery Partner Info */}
      {order.deliveryPartner && (
        <div className="mt-3 pt-3 border-t border-gray-100">
          <div className="flex items-center gap-2 text-xs sm:text-sm">
            <FiTruck className="w-4 h-4 text-gray-500" />
            <span className="text-gray-600">Delivery Partner:</span>
            <span className="font-medium text-gray-900">{order.deliveryPartner}</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default React.memo(OrderCard);
