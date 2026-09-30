import { useCallback, useEffect, useState } from 'react';
import { getUserFacingErrorMessage } from '../utils/apiResponse';
import notificationService from '../services/notificationService';
import { mapNotifications } from '../utils/deliveryMapper';
import { getSocket } from './useOrderStatusSync';


export function useNotifications({ autoLoad = true, page = 1, limit = 20, read, category } = {}) {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(Boolean(autoLoad));
  const [error, setError] = useState(null);
  const [unreadCount, setUnreadCount] = useState(0);

  const refreshNotifications = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [payload, countPayload] = await Promise.all([notificationService.getNotifications({ page, limit, read, category }), notificationService.getUnreadCount()]);
      const body = payload?.data ?? payload;
      const countBody = countPayload?.data ?? countPayload;
      setNotifications(mapNotifications(body?.notifications || body));
      setUnreadCount(Number(countBody?.unreadCount ?? body?.unreadCount ?? 0));
    } catch (loadError) {
      setError(getUserFacingErrorMessage(loadError, 'Failed to load notifications'));
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  }, [page, limit, read, category]);

  useEffect(() => {
    const socket = getSocket();
    if (!socket) return undefined;
    const onNotification = (notification) => {
      const [mapped] = mapNotifications([notification]);
      if (!mapped) return;
      setNotifications((current) => {
        if (current.some((item) => item.id === mapped.id)) return current;
        if (!mapped.read) setUnreadCount((count) => count + 1);
        return [mapped, ...current].slice(0, limit);
      });
    };
    socket.on('notification', onNotification);
    return () => socket.off('notification', onNotification);
  }, [limit]);

  useEffect(() => {
    if (autoLoad) {
      refreshNotifications();
    }
  }, [autoLoad, refreshNotifications]);

  const markAsRead = useCallback(async (notificationId) => {
    await notificationService.markAsRead(notificationId);
    setNotifications((current) => current.map((notification) => {
      if (notification.id !== notificationId || notification.read) return notification;
      setUnreadCount((count) => Math.max(0, count - 1));
      return { ...notification, isRead: true, read: true };
    }));
  }, []);

  const markAllAsRead = useCallback(async () => {
    await notificationService.markAllAsRead();
    setNotifications((current) =>
      current.map((notification) => ({ ...notification, isRead: true, read: true }))
    );
    setUnreadCount(0);
  }, []);

  return {
    notifications,
    unreadCount,
    loading,
    error,
    refreshNotifications,
    markAsRead,
    markAllAsRead,
  };
}

export default useNotifications;
