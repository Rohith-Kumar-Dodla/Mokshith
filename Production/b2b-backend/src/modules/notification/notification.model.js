import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      index: true,
    },

    title: {
      type: String,
      required: true,
    },

    message: {
      type: String,
      required: true,
    },

    type: {
      type: String,
      enum: ['ORDER', 'PAYMENT', 'SYSTEM', 'ACCOUNT', 'USER', 'CATALOG', 'SUPPLIER', 'LOGISTICS', 'INVENTORY'],
      default: 'SYSTEM',
    },

    category: { type: String, trim: true, uppercase: true, index: true, default: 'SYSTEM' },
    eventType: { type: String, trim: true, uppercase: true, index: true, default: 'SYSTEM_EVENT' },
    entityType: { type: String, trim: true, uppercase: true, default: null },
    entityId: { type: mongoose.Schema.Types.ObjectId, default: null },
    actionUrl: { type: String, trim: true, default: null },
    severity: { type: String, enum: ['INFO', 'SUCCESS', 'WARNING', 'ERROR'], default: 'INFO' },
    // Keep absent when no idempotency key is supplied. A sparse unique index
    // still indexes explicit null values, which would suppress unrelated
    // legacy notifications for the same user.
    eventKey: { type: String, trim: true, default: undefined },
    actorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    metadata: { type: mongoose.Schema.Types.Mixed, default: {} },

    isRead: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

notificationSchema.index({ userId: 1, isRead: 1, createdAt: -1 });
notificationSchema.index({ userId: 1, category: 1, createdAt: -1 });
notificationSchema.index({ userId: 1, eventKey: 1 }, { unique: true, sparse: true });

export default mongoose.model('Notification', notificationSchema);
