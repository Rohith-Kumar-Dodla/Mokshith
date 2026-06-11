import { useState } from "react";
import { useNotifications } from "../hooks/useNotifications.js";
import NotificationItem from "../components/NotificationItem.jsx";
import NotificationDetailPanel from "../components/NotificationDetailPanel.jsx";
import EmptyState from "../../../components/ui/EmptyState.jsx";
import { Bell, CheckCheck, AlertCircle } from "lucide-react";
import Button from "../../../components/ui/Button.jsx";

const NotificationPage = () => {
  const {
    notifications,
    loading,
    error,
    unreadCount,
    selectedNotification,
    setSelectedNotification,
    markAsRead,
  } = useNotifications();

  const [panelOpen, setPanelOpen] = useState(false);

  const handleSelect = (notification) => {
    setSelectedNotification(notification);
    setPanelOpen(true);
  };

  const handleMarkAllRead = async () => {
    const unread = notifications.filter((n) => !n.isRead && !n.read);
    await Promise.all(unread.map((n) => markAsRead(n._id || n.id)));
  };

  if (loading) {
    return (
      <div className="py-16 text-center text-gray-500">Loading notifications...</div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Notifications</h1>
          <p className="text-gray-500 mt-1">
            {unreadCount > 0 ? `${unreadCount} unread notification${unreadCount > 1 ? 's' : ''}` : 'All caught up!'}
          </p>
        </div>
        {unreadCount > 0 && (
          <Button variant="secondary" size="small" onClick={handleMarkAllRead}>
            <CheckCheck size={16} className="mr-2" />
            Mark all read
          </Button>
        )}
      </div>

      {error && (
        <div className="flex items-center gap-3 text-red-600 py-8 justify-center">
          <AlertCircle size={20} />
          <span>{error}</span>
        </div>
      )}

      {!error && notifications.length === 0 && (
        <EmptyState
          icon={Bell}
          title="No notifications"
          description="You're all caught up! New notifications will appear here."
        />
      )}

      <div className="space-y-3">
        {notifications.map((n) => (
          <NotificationItem
            key={n._id || n.id}
            notification={n}
            onRead={markAsRead}
            onSelect={handleSelect}
          />
        ))}
      </div>

      <NotificationDetailPanel
        notification={selectedNotification}
        isOpen={panelOpen}
        onClose={() => { setPanelOpen(false); setSelectedNotification(null); }}
        onMarkRead={markAsRead}
      />
    </div>
  );
};

export default NotificationPage;
