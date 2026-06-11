import React, { useState, useEffect, useRef } from 'react';
import { FiBell, FiX, FiCheck } from 'react-icons/fi';

const NotificationDrawer = ({ isOpen, onClose, notifications }) => {
  const drawerRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (drawerRef.current && !drawerRef.current.contains(event.target)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={onClose}></div>
      <div
        ref={drawerRef}
        className="absolute right-0 top-0 h-full w-full sm:max-w-md bg-white shadow-2xl"
      >
        <div className="flex items-center justify-between p-4 sm:p-6 border-b border-gray-100">
          <h2 className="text-lg sm:text-xl font-semibold text-gray-900">Notifications</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors min-h-[44px] min-w-[44px]"
          >
            <FiX size={20} className="text-gray-500" />
          </button>
        </div>

        <div className="p-3 sm:p-4 space-y-2 sm:space-y-3 overflow-y-auto h-[calc(100vh-72px)] sm:h-[calc(100vh-80px)]">
          {notifications.map((notification, index) => (
            <div
              key={index}
              className={`p-3 sm:p-4 rounded-xl border transition-all ${
                notification.read ? 'bg-white border-gray-100' : 'bg-blue-50 border-blue-200'
              }`}
            >
              <div className="flex items-start gap-3">
                <div className="p-2 bg-blue-100 rounded-lg flex-shrink-0">
                  <FiBell className="text-blue-600" size={16} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{notification.title}</p>
                  <p className="text-xs text-gray-500 mt-1 line-clamp-2">{notification.message}</p>
                  <p className="text-xs text-gray-400 mt-2">{notification.time}</p>
                </div>
                {!notification.read && (
                  <button className="p-1 hover:bg-blue-100 rounded transition-colors min-h-[32px] min-w-[32px]">
                    <FiCheck className="text-blue-600" size={14} />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default NotificationDrawer;
