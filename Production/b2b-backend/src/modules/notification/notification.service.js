import * as repo from './notification.repository.js';
import { notificationQueue } from '../../queues/notification.queue.js';
import { fetchSetting } from '../settings/settings.service.js';
import { logger } from '../../config/logger.js';

export const sendNotification = async (data) => {
  const setting = await fetchSetting('notifications');
  if (setting && setting.value === false && !data.force) {
    return null;
  }

  // Persist in-app notification first. Queue enqueue is best-effort for
  // email/socket workers — Redis/BullMQ failures must not drop the row.
  let created;
  try {
    if (data.eventKey) {
      const existing = await repo.findByEventKey(data.userId, data.eventKey);
      if (existing) return existing;
    }
    created = await repo.createNotification(data);
  } catch (error) {
    if (error?.code === 11000 && data.eventKey) return repo.findByEventKey(data.userId, data.eventKey);
    throw error;
  }

  const realtimePayload = created.toObject ? created.toObject() : created;
  try {
    global.io?.to(String(data.userId)).emit('notification', realtimePayload);
  } catch (err) {
    logger.warn('Realtime notification delivery failed', { userId: data?.userId, error: err?.message || String(err) });
  }

  try {
    const queueData = { ...data };
    delete queueData.force;
    await notificationQueue.add({ ...queueData, notificationId: created._id, skipRealtime: true });
  } catch (err) {
    logger.warn('Notification queue enqueue failed; in-app notification persisted', {
      userId: data?.userId,
      title: data?.title,
      error: err?.message || String(err),
    });
  }

  return created;
};

export const getNotifications = async (userId, filters = {}) => {
  return repo.findByUser(userId, filters);
};

export const getUnreadCount = async (userId) => ({ unreadCount: await repo.getUnreadCount(userId) });

export const markAsRead = async (id, userId) => {
  const notification = await repo.markAsRead(id, userId);
  return notification;
};

export const markAllAsRead = async (userId) => {
  await repo.markAllAsRead(userId);
  return { unreadCount: 0 };
};
