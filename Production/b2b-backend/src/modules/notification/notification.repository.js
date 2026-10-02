import Notification from './notification.model.js';
import crypto from 'crypto';

export const createNotification = (data) => {
  const payload = { ...data };
  // Legacy deployments may still have the former sparse unique index where
  // explicit null values collide. Give non-idempotent events a unique internal
  // key; caller-provided keys retain their deduplication semantics.
  if (!payload.eventKey) payload.eventKey = `auto:${crypto.randomUUID()}`;
  return Notification.create(payload);
};

export const findByUser = async (userId, filters = {}) => {
  const page = Number(filters.page || 1);
  const limit = Number(filters.limit || 20);
  const query = { userId };
  if (filters.read === 'true') query.isRead = true;
  if (filters.read === 'false') query.isRead = false;
  if (filters.category) query.category = filters.category;
  if (filters.eventType) query.eventType = filters.eventType;
  if (filters.startDate || filters.endDate) {
    query.createdAt = {};
    if (filters.startDate) query.createdAt.$gte = new Date(filters.startDate);
    if (filters.endDate) query.createdAt.$lte = new Date(filters.endDate);
  }
  const [notifications, total, unreadCount] = await Promise.all([
    Notification.find(query).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).lean(),
    Notification.countDocuments(query),
    Notification.countDocuments({ userId, isRead: false }),
  ]);
  return { notifications, unreadCount, pagination: { page, limit, total, pages: Math.ceil(total / limit) } };
};

export const findByEventKey = (userId, eventKey) => Notification.findOne({ userId, eventKey });

export const getUnreadCount = (userId) => Notification.countDocuments({ userId, isRead: false });

export const markAsRead = (id, userId) =>
  Notification.findOneAndUpdate({ _id: id, userId }, { isRead: true }, { new: true });

export const markAllAsRead = (userId) =>
  Notification.updateMany({ userId, isRead: false }, { isRead: true });
