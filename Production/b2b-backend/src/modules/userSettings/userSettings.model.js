import mongoose from 'mongoose';

const notificationSchema = {
  email: { type: Boolean, default: true },
  sms: { type: Boolean, default: true },
  push: { type: Boolean, default: true },
  orders: { type: Boolean, default: true },
};

const preferenceSchema = {
  language: { type: String, enum: ['en', 'hi', 'te'], default: 'en' },
  theme: { type: String, enum: ['light', 'dark', 'system'], default: 'light' },
  dashboardLayout: { type: String, enum: ['default', 'compact', 'detailed'], default: 'default' },
};

const userSettingsSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
      index: true,
    },
    role: {
      type: String,
      required: true,
      index: true,
    },
    notifications: {
      type: notificationSchema,
      default: () => ({}),
    },
    preferences: {
      type: preferenceSchema,
      default: () => ({}),
    },
    businessDetails: {
      type: String,
      default: '',
      maxlength: 2000,
    },
  },
  { timestamps: true }
);

export default mongoose.model('UserSettings', userSettingsSchema);
