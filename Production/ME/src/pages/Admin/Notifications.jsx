import React from 'react';
import { FiBell, FiCheck } from 'react-icons/fi';
import PageHeader from '../../components/admin/PageHeader';
import Card from '../../components/admin/Card';
import useNotifications from '../../hooks/useNotifications';

const Notifications = () => {
  const { notifications, loading, error, markAsRead, markAllAsRead } = useNotifications();
  return <div className="space-y-6">
    <PageHeader title="Notifications" subtitle="Operational alerts for your Admin account" />
    <Card className="p-4 sm:p-6">
      <div className="flex items-center justify-between border-b pb-4 mb-2"><h2 className="font-semibold">Notification center</h2><button type="button" onClick={markAllAsRead} className="inline-flex items-center gap-2 text-sm text-blue-600 min-h-[44px]"><FiCheck /> Mark all as read</button></div>
      {loading && <p className="py-8 text-center text-sm text-gray-500">Loading notifications...</p>}
      {error && <p className="py-4 text-sm text-red-700">{error}</p>}
      {!loading && !error && notifications.length === 0 && <p className="py-8 text-center text-sm text-gray-500">No notifications.</p>}
      <div className="divide-y">{notifications.map((notification) => <button type="button" key={notification.id} onClick={() => !notification.isRead && markAsRead(notification.id)} className={`w-full text-left p-4 rounded-lg hover:bg-gray-50 ${!notification.isRead ? 'bg-blue-50' : ''}`}><div className="flex gap-3"><FiBell className="mt-1 text-blue-600" /><div><p className="font-medium text-gray-900">{notification.title}</p><p className="text-sm text-gray-600 mt-1">{notification.message}</p><p className="text-xs text-gray-400 mt-2">{notification.time}</p></div></div></button>)}</div>
    </Card>
  </div>;
};
export default Notifications;
