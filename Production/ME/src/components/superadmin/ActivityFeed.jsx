import React from 'react';
import { FiUserPlus, FiShoppingBag, FiTruck, FiPackage, FiCheckCircle } from 'react-icons/fi';

const ActivityFeed = ({ activities }) => {
  const getIcon = (type) => {
    switch (type) {
      case 'admin_added':
        return <FiUserPlus className="text-blue-500" />;
      case 'vendor_registered':
        return <FiShoppingBag className="text-green-500" />;
      case 'order_placed':
        return <FiPackage className="text-purple-500" />;
      case 'delivery_completed':
        return <FiTruck className="text-teal-500" />;
      case 'product_added':
        return <FiCheckCircle className="text-orange-500" />;
      default:
        return <FiCheckCircle className="text-gray-500" />;
    }
  };

  const getIconBg = (type) => {
    switch (type) {
      case 'admin_added':
        return 'bg-blue-50';
      case 'vendor_registered':
        return 'bg-green-50';
      case 'order_placed':
        return 'bg-purple-50';
      case 'delivery_completed':
        return 'bg-teal-50';
      case 'product_added':
        return 'bg-orange-50';
      default:
        return 'bg-gray-50';
    }
  };

  return (
    <div className="space-y-3 sm:space-y-4">
      {activities.map((activity, index) => (
        <div key={index} className="flex gap-3 sm:gap-4">
          <div className={`p-2 sm:p-3 rounded-xl ${getIconBg(activity.type)} flex-shrink-0`}>
            {getIcon(activity.type)}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs sm:text-sm font-medium text-gray-900 truncate">{activity.title}</p>
            <p className="text-xs text-gray-500 mt-0.5 sm:mt-1 line-clamp-2">{activity.description}</p>
            <p className="text-xs text-gray-400 mt-0.5 sm:mt-1">{activity.time}</p>
          </div>
        </div>
      ))}
    </div>
  );
};

export default ActivityFeed;
