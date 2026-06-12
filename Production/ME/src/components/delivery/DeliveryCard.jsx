import React from 'react';
import { Link } from 'react-router-dom';
import { FiMapPin, FiPackage, FiClock, FiArrowRight } from 'react-icons/fi';
import StatusBadge from './StatusBadge';

import React from 'react';

const DeliveryCard = ({ order }) => {
  const getPriorityColor = (priority) => {
    switch (priority?.toLowerCase()) {
      case 'high':
        return 'bg-red-100 text-red-700';
      case 'medium':
        return 'bg-yellow-100 text-yellow-700';
      case 'low':
        return 'bg-green-100 text-green-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4 sm:p-5 hover:shadow-lg transition-shadow">
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2 sm:gap-4 mb-3 sm:mb-4">
        <div>
          <h3 className="font-bold text-base sm:text-lg text-gray-900">{order.id}</h3>
          <p className="text-xs sm:text-sm text-gray-600">{order.vendor}</p>
        </div>
        <div className="flex flex-row sm:flex-col items-end gap-2">
          <StatusBadge status={order.status} />
          <span className={`text-xs font-semibold px-2 py-1 rounded-full ${getPriorityColor(order.priority)}`}>
            {order.priority?.toUpperCase()}
          </span>
        </div>
      </div>

      <div className="space-y-2 sm:space-y-3 mb-3 sm:mb-4">
        <div className="flex items-start gap-2 sm:gap-3">
          <FiMapPin className="text-blue-500 mt-1 flex-shrink-0" size={14} />
          <div className="flex-1">
            <p className="text-xs text-gray-500">Pickup</p>
            <p className="text-xs sm:text-sm text-gray-700">{order.pickupLocation}</p>
          </div>
        </div>
        <div className="flex items-start gap-2 sm:gap-3">
          <FiMapPin className="text-green-500 mt-1 flex-shrink-0" size={14} />
          <div className="flex-1">
            <p className="text-xs text-gray-500">Delivery</p>
            <p className="text-xs sm:text-sm text-gray-700">{order.deliveryLocation}</p>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3 sm:gap-4 mb-3 sm:mb-4 text-xs sm:text-sm text-gray-600">
        <div className="flex items-center gap-1.5 sm:gap-2">
          <FiPackage size={14} className="sm:size-16" />
          <span>{order.itemsCount} items</span>
        </div>
        <div className="flex items-center gap-1.5 sm:gap-2">
          <FiClock size={14} className="sm:size-16" />
          <span>{order.distance} km</span>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 pt-3 sm:pt-4 border-t border-gray-100">
        <div>
          <p className="text-xs text-gray-500">Order Amount</p>
          <p className="font-bold text-sm sm:text-base text-gray-900">₹{order.orderAmount?.toFixed(2)}</p>
        </div>
        <Link
          to={`/delivery/order-details/${order.id}`}
          className="inline-flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2.5 h-10 sm:h-12 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-xs sm:text-sm font-medium"
        >
          View Details
          <FiArrowRight size={14} className="sm:size-16" />
        </Link>
      </div>
    </div>
  );
};

export default React.memo(DeliveryCard);
