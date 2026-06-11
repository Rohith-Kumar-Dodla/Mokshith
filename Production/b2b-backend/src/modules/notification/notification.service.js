import * as repo from './notification.repository.js';
import { notificationQueue } from '../../queues/notification.queue.js';
import { fetchSetting } from '../settings/settings.service.js';

export const sendNotification = async (data) => {
  const setting = await fetchSetting('notifications');
  if (setting && setting.value === false) {
    return null;
  }
  
  // 🔥 Queue-based (async processing)
  await notificationQueue.add(data);

  return repo.createNotification(data);
};

export const getNotifications = async (userId) => {
  return repo.findByUser(userId);
};

export const markAsRead = async (id) => {
  return repo.markAsRead(id);
};