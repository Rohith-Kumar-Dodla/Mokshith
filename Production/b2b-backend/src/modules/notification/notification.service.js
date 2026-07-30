import * as repo from './notification.repository.js';
import { notificationQueue } from '../../queues/notification.queue.js';
import { fetchSetting } from '../settings/settings.service.js';
import { logger } from '../../config/logger.js';

export const sendNotification = async (data) => {
  const setting = await fetchSetting('notifications');
  if (setting && setting.value === false) {
    return null;
  }

  // Persist in-app notification first. Queue enqueue is best-effort for
  // email/socket workers — Redis/BullMQ failures must not drop the row.
  const created = await repo.createNotification(data);

  try {
    await notificationQueue.add(data);
  } catch (err) {
    logger.warn('Notification queue enqueue failed; in-app notification persisted', {
      userId: data?.userId,
      title: data?.title,
      error: err?.message || String(err),
    });
  }

  return created;
};

export const getNotifications = async (userId) => {
  return repo.findByUser(userId);
};

export const markAsRead = async (id) => {
  return repo.markAsRead(id);
};

export const markAllAsRead = async (userId) => {
  await repo.markAllAsRead(userId);
  return repo.findByUser(userId);
};
