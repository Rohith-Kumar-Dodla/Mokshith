import { Bell, Package, CreditCard, Settings } from 'lucide-react';

const typeIcons = {
  ORDER: Package,
  PAYMENT: CreditCard,
  SYSTEM: Settings,
};

const NotificationItem = ({ notification, onRead, onSelect }) => {
  const isUnread = !notification.isRead && !notification.read;
  const Icon = typeIcons[notification.type] || Bell;

  const handleClick = () => {
    onSelect?.(notification);
    if (isUnread) onRead(notification._id || notification.id);
  };

  return (
    <div
      className={`p-4 rounded-xl border cursor-pointer transition-all hover:shadow-md ${
        isUnread
          ? 'bg-blue-50 border-blue-100'
          : 'bg-white border-gray-100'
      }`}
      onClick={handleClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && handleClick()}
    >
      <div className="flex items-start gap-3">
        <div className={`p-2 rounded-lg ${isUnread ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-500'}`}>
          <Icon size={18} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <h4 className={`text-sm font-bold truncate ${isUnread ? 'text-gray-900' : 'text-gray-700'}`}>
              {notification.title}
            </h4>
            {isUnread && <span className="w-2 h-2 bg-blue-600 rounded-full shrink-0" />}
          </div>
          <p className="text-sm text-gray-500 mt-1 line-clamp-2">{notification.message}</p>
          <small className="text-xs text-gray-400 mt-2 block">
            {new Date(notification.createdAt).toLocaleString()}
          </small>
        </div>
      </div>
    </div>
  );
};

export default NotificationItem;
