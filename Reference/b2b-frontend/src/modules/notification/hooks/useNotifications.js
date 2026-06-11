import { useState, useEffect, useCallback } from "react";
import { notificationService } from "../services/notificationService.js";
import { useSocket } from "../../../context/SocketContext.jsx";

export const useNotifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedNotification, setSelectedNotification] = useState(null);
  const { on } = useSocket();

  const fetchNotifications = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await notificationService.getNotifications();
      setNotifications(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  const markAsRead = async (id) => {
    try {
      await notificationService.markAsRead(id);
      setNotifications((prev) =>
        prev.map((n) =>
          (n._id === id || n.id === id) ? { ...n, isRead: true, read: true } : n
        )
      );
    } catch (err) {
      console.error(err);
    }
  };

  const unreadCount = notifications.filter((n) => !n.isRead && !n.read).length;

  useEffect(() => {
    fetchNotifications();

    const offNew = on('notification:new', (data) => {
      setNotifications((prev) => [data, ...prev]);
    });

    return () => offNew?.();
  }, [fetchNotifications, on]);

  return {
    notifications,
    loading,
    error,
    unreadCount,
    selectedNotification,
    setSelectedNotification,
    markAsRead,
    refetch: fetchNotifications,
  };
};
