import UserSettings from './userSettings.model.js';
import AppError from '../../errors/AppError.js';

const DEFAULT_SETTINGS = {
  notifications: {
    email: true,
    sms: true,
    push: true,
    orders: true,
  },
  preferences: {
    language: 'en',
    theme: 'light',
    dashboardLayout: 'default',
  },
  businessDetails: '',
};

export const getOrCreateUserSettings = async (userId, role) => {
  let settings = await UserSettings.findOne({ userId }).lean();

  if (!settings) {
    settings = await UserSettings.create({
      userId,
      role,
      ...DEFAULT_SETTINGS,
    });
    return settings.toObject ? settings.toObject() : settings;
  }

  return settings;
};

export const updateUserSettings = async (userId, role, data) => {
  const update = {};

  if (data.notifications) {
    for (const [key, value] of Object.entries(data.notifications)) {
      update[`notifications.${key}`] = value;
    }
  }

  if (data.preferences) {
    for (const [key, value] of Object.entries(data.preferences)) {
      update[`preferences.${key}`] = value;
    }
  }

  if (data.businessDetails !== undefined) {
    update.businessDetails = data.businessDetails;
  }

  if (Object.keys(update).length === 0) {
    throw new AppError('No valid settings fields provided', 400);
  }

  const settings = await UserSettings.findOneAndUpdate(
    { userId },
    { $set: update, role },
    { new: true, upsert: true, setDefaultsOnInsert: true }
  ).lean();

  return settings;
};
