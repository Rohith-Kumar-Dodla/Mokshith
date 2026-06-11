import { simulateApi } from '../../../mocks/mockApi.js';
import { mockNotifications } from '../../../mocks/data/index.js';

let notificationStore = [...mockNotifications];

export const notificationService = {
  async getNotifications() {
    return simulateApi(() =>
      [...notificationStore].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    );
  },

  async markAsRead(id) {
    return simulateApi(() => {
      const index = notificationStore.findIndex((n) => n._id === id || n.id === id);
      if (index === -1) throw new Error('Notification not found');
      notificationStore[index] = { ...notificationStore[index], isRead: true, read: true };
      return notificationStore[index];
    });
  },

  async getUnreadCount() {
    const notifications = await this.getNotifications();
    return notifications.filter((n) => !n.isRead && !n.read).length;
  },
};
