import Drawer from '../../../components/ui/Drawer.jsx';

const typeColors = {
  ORDER: 'bg-blue-100 text-blue-700',
  PAYMENT: 'bg-green-100 text-green-700',
  SYSTEM: 'bg-gray-100 text-gray-700',
};

const NotificationDetailPanel = ({ notification, isOpen, onClose, onMarkRead }) => {
  if (!notification) return null;

  const isUnread = !notification.isRead && !notification.read;

  return (
    <Drawer isOpen={isOpen} onClose={onClose} title="Notification Details">
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <span className={`px-3 py-1 rounded-full text-xs font-bold ${typeColors[notification.type] || typeColors.SYSTEM}`}>
            {notification.type || 'SYSTEM'}
          </span>
          {isUnread && (
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-red-100 text-red-700">
              Unread
            </span>
          )}
        </div>

        <div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">{notification.title}</h3>
          <p className="text-gray-600 leading-relaxed">{notification.message}</p>
        </div>

        <div>
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Received</p>
          <p className="text-sm text-gray-700">
            {new Date(notification.createdAt).toLocaleString()}
          </p>
        </div>

        {isUnread && (
          <button
            onClick={() => onMarkRead(notification._id || notification.id)}
            className="w-full py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-colors"
          >
            Mark as Read
          </button>
        )}
      </div>
    </Drawer>
  );
};

export default NotificationDetailPanel;
