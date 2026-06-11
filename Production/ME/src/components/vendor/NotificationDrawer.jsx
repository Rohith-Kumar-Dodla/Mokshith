import React from 'react';
import { FiBell, FiX, FiCheck, FiShoppingCart, FiTruck, FiPackage, FiTag } from 'react-icons/fi';

const NotificationDrawer = ({ isOpen, onClose, notifications = [] }) => {
  const getNotificationIcon = (type) => {
    switch (type) {
      case 'order_confirmed':
        return <FiCheck className="w-5 h-5" />;
      case 'order_shipped':
        return <FiTruck className="w-5 h-5" />;
      case 'order_delivered':
        return <FiPackage className="w-5 h-5" />;
      case 'new_product':
        return <FiShoppingCart className="w-5 h-5" />;
      case 'offer':
        return <FiTag className="w-5 h-5" />;
      default:
        return <FiBell className="w-5 h-5" />;
    }
  };

  const getNotificationColor = (type) => {
    switch (type) {
      case 'order_confirmed':
        return 'bg-green-100 text-green-600';
      case 'order_shipped':
        return 'bg-blue-100 text-blue-600';
      case 'order_delivered':
        return 'bg-green-100 text-green-600';
      case 'new_product':
        return 'bg-purple-100 text-purple-600';
      case 'offer':
        return 'bg-orange-100 text-orange-600';
      default:
        return 'bg-gray-100 text-gray-600';
    }
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <>
      {/* Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40"
          onClick={onClose}
        />
      )}

      {/* Drawer */}
      <div
        className={`fixed top-0 right-0 h-full w-full max-w-md bg-white shadow-2xl z-50 transform transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="relative">
              <FiBell className="w-6 h-6 text-gray-700" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                  {unreadCount}
                </span>
              )}
            </div>
            <h2 className="text-lg font-semibold text-gray-900">Notifications</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <FiX className="w-5 h-5 text-gray-600" />
          </button>
        </div>

        {/* Notifications List */}
        <div className="flex-1 overflow-y-auto">
          {notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-500">
              <FiBell className="w-12 h-12 mb-3" />
              <p>No notifications</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`p-4 hover:bg-gray-50 transition-colors cursor-pointer ${
                    !notification.read ? 'bg-blue-50' : ''
                  }`}
                >
                  <div className="flex gap-3">
                    <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${getNotificationColor(notification.type)}`}>
                      {getNotificationIcon(notification.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <h4 className="font-medium text-gray-900 text-sm">{notification.title}</h4>
                        {!notification.read && (
                          <span className="flex-shrink-0 w-2 h-2 bg-blue-500 rounded-full" />
                        )}
                      </div>
                      <p className="text-sm text-gray-600 mb-2">{notification.message}</p>
                      <p className="text-xs text-gray-400">{notification.time}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        {notifications.length > 0 && (
          <div className="p-4 border-t border-gray-200">
            <button className="w-full py-2 px-4 text-sm text-blue-600 hover:bg-blue-50 rounded-lg transition-colors font-medium">
              Mark All as Read
            </button>
          </div>
        )}
      </div>
    </>
  );
};

export default NotificationDrawer;
