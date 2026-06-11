import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Bell } from 'lucide-react';
import { routes } from '../../routes/routeConfig.js';
import { notificationService } from '../../modules/notification/services/notificationService.js';
import { useSocket } from '../../context/SocketContext.jsx';

const NotificationBadge = ({ className = '' }) => {
  const [unreadCount, setUnreadCount] = useState(0);
  const { on } = useSocket();

  const fetchCount = async () => {
    try {
      const notifications = await notificationService.getNotifications();
      const count = notifications.filter((n) => !n.isRead && !n.read).length;
      setUnreadCount(count);
    } catch {
      setUnreadCount(0);
    }
  };

  useEffect(() => {
    fetchCount();

    const offNew = on('notification:new', () => {
      setUnreadCount((prev) => prev + 1);
    });

    const offRead = on('notification:read', () => {
      fetchCount();
    });

    return () => {
      offNew?.();
      offRead?.();
    };
  }, [on]);

  return (
    <Link
      to={routes.NOTIFICATIONS}
      className={`p-2 md:p-3 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-2xl transition-all relative ${className}`}
      aria-label={`Notifications${unreadCount > 0 ? `, ${unreadCount} unread` : ''}`}
    >
      <Bell size={22} className="md:w-6 md:h-6" />
      {unreadCount > 0 && (
        <span className="absolute top-1 right-1 md:top-2 md:right-2 bg-red-500 text-white text-[9px] md:text-[10px] font-black w-4 h-4 md:w-5 md:h-5 rounded-full flex items-center justify-center border-2 border-white shadow-lg animate-pulse">
          {unreadCount > 9 ? '9+' : unreadCount}
        </span>
      )}
    </Link>
  );
};

export default NotificationBadge;
