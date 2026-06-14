import React from 'react';
import { FiBell, FiX, FiCheck, FiTruck, FiDollarSign, FiAward, FiMapPin, FiAlertCircle } from 'react-icons/fi';

const NotificationDrawer = ({ isOpen, onClose, notifications }) => {
  const getNotificationIcon = (type) => {
    switch (type) {
      case 'new_delivery':
        return <FiTruck className="text-blue-500" size={16} />;
      case 'delivery_completed':
        return <FiCheck className="text-green-500" size={16} />;
      case 'bonus_earned':
        return <FiDollarSign className="text-yellow-500" size={16} />;
      case 'performance_milestone':
        return <FiAward className="text-purple-500" size={16} />;
      case 'area_update':
        return <FiMapPin className="text-orange-500" size={16} />;
      case 'delivery_failed':
        return <FiAlertCircle className="text-red-500" size={16} />;
      default:
        return <FiBell className="text-gray-500" size={16} />;
    }
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 z-40"
        onClick={onClose}
      />

      {/* Drawer */}
      <div className="fixed right-0 top-0 h-full w-full sm:max-w-md bg-white shadow-2xl z-50 transform transition-transform">
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-4 sm:p-6 border-b border-gray-200">
            <div className="flex items-center gap-2 sm:gap-3">
              <FiBell className="w-5 h-5 text-gray-700 flex-shrink-0" />
              <h2 className="text-lg sm:text-xl font-bold text-gray-900">Notifications</h2>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors min-h-[40px] min-w-[40px] flex items-center justify-center"
            >
              <FiX className="w-5 h-5 text-gray-600" />
            </button>
          </div>

          {/* Notifications List */}
          <div className="flex-1 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-gray-500">
                <FiBell className="w-9 h-9 mb-3 sm:mb-4 text-gray-300" />
                <p className="text-sm sm:text-base">No notifications</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`p-3 sm:p-4 hover:bg-gray-50 transition-colors ${
                      !notification.read ? 'bg-blue-50' : ''
                    }`}
                  >
                    <div className="flex items-start gap-2 sm:gap-3">
                      <div className="p-2 bg-gray-100 rounded-lg flex-shrink-0">
                        {getNotificationIcon(notification.type)}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-start justify-between mb-1">
                          <h4 className="font-semibold text-gray-900 text-xs sm:text-sm">
                            {notification.title}
                          </h4>
                          {!notification.read && (
                            <span className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0 mt-1.5 sm:mt-2" />
                          )}
                        </div>
                        <p className="text-xs sm:text-sm text-gray-600 mb-1.5 sm:mb-2">
                          {notification.message}
                        </p>
                        <p className="text-xs text-gray-400">{notification.time}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="p-3 sm:p-4 border-t border-gray-200">
            <button className="w-full py-2.5 h-10 sm:h-12 text-xs sm:text-sm text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
              Mark all as read
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default NotificationDrawer;
