import React, { useState, useEffect, useRef } from 'react';
import { FiBell, FiX, FiCheck } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';

const NotificationDrawer = ({ isOpen, onClose, notifications, loading, error, onRetry, onMarkRead, onMarkAllRead }) => {
  const drawerRef = useRef(null);
  const navigate = useNavigate();

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
          <div><h2 className="text-lg sm:text-xl font-semibold text-gray-900">Notifications</h2><button type="button" onClick={onMarkAllRead} className="mt-1 text-xs text-blue-600 hover:underline">Mark all as read</button></div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors min-h-[44px] min-w-[44px]"
          >
            <FiX size={20} className="text-gray-500" />
          </button>
        </div>

        <div className="p-3 sm:p-4 space-y-2 sm:space-y-3 overflow-y-auto h-[calc(100vh-72px)] sm:h-[calc(100vh-80px)]">
          {loading && <p className="p-6 text-center text-sm text-gray-500">Loading notifications…</p>}
          {error && <div className="rounded-lg bg-red-50 p-4 text-sm text-red-700">{error}<button type="button" onClick={onRetry} className="ml-2 font-medium underline">Retry</button></div>}
          {!loading && !error && notifications.length === 0 && <p className="p-8 text-center text-sm text-gray-500">No notifications yet.</p>}
          {notifications.map((notification) => (
            <div
              key={notification.id}
              role={notification.actionUrl ? 'button' : undefined}
              tabIndex={notification.actionUrl ? 0 : undefined}
              onClick={async () => { if (!notification.read) await onMarkRead?.(notification.id); if (notification.actionUrl) { navigate(notification.actionUrl); onClose(); } }}
              className={`p-3 sm:p-4 rounded-xl border transition-all ${
                notification.read ? 'bg-white border-gray-100' : 'bg-blue-50 border-blue-200'
              }`}
            >
              <div className="flex items-start gap-3">
                <div className="p-2 bg-blue-100 rounded-lg flex-shrink-0">
                  <FiBell className="text-blue-600" size={16} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2"><p className="text-sm font-medium text-gray-900 truncate">{notification.title}</p><span className="rounded bg-gray-100 px-1.5 py-0.5 text-[10px] text-gray-600">{notification.category}</span></div>
                  <p className="text-xs text-gray-500 mt-1 line-clamp-2">{notification.message}</p>
                  <p className="text-xs text-gray-400 mt-2">{notification.time}</p>
                </div>
                {!notification.read && (
                  <button type="button" aria-label="Mark notification as read" onClick={(event) => { event.stopPropagation(); onMarkRead?.(notification.id); }} className="p-1 hover:bg-blue-100 rounded transition-colors min-h-[32px] min-w-[32px]">
                    <FiCheck className="text-blue-600" size={14} />
                  </button>
                )}
              </div>
            </div>
          ))}
          <button type="button" onClick={() => { navigate('/super-admin/notifications'); onClose(); }} className="w-full min-h-[44px] rounded-lg border text-sm font-medium text-blue-600">View all notifications</button>
        </div>
      </div>
    </div>
  );
};

export default NotificationDrawer;
