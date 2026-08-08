import { useCallback, useEffect, useMemo, useState } from 'react';
import { getUserFacingErrorMessage } from '../utils/apiResponse';
import notificationService from '../services/notificationService';
import { mapNotifications } from '../utils/deliveryMapper';


export function useNotifications({ autoLoad = true } = {}) {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(Boolean(autoLoad));
  const [error, setError] = useState(null);

  const refreshNotifications = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const payload = await notificationService.getNotifications();
      setNotifications(mapNotifications(payload));
    } catch (loadError) {
      setError(getUserFacingErrorMessage(loadError, 'Failed to load notifications'));
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (autoLoad) {
      refreshNotifications();
    }
  }, [autoLoad, refreshNotifications]);

  const unreadCount = useMemo(
    () => notifications.filter((notification) => !notification.isRead && !notification.read).length,
    [notifications]
  );

  const markAsRead = useCallback(async (notificationId) => {
    await notificationService.markAsRead(notificationId);
    setNotifications((current) =>
      current.map((notification) =>
        notification.id === notificationId
          ? { ...notification, isRead: true, read: true }
          : notification
      )
    );
  }, []);

  const markAllAsRead = useCallback(async () => {
    await notificationService.markAllAsRead();
    setNotifications((current) =>
      current.map((notification) => ({ ...notification, isRead: true, read: true }))
    );
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
