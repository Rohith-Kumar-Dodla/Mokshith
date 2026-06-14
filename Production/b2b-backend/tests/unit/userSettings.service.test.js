import { describe, it, expect, beforeEach } from '@jest/globals';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import UserSettings from '../../src/modules/userSettings/userSettings.model.js';
import {
  getOrCreateUserSettings,
  updateUserSettings,
} from '../../src/modules/userSettings/userSettings.service.js';
import AppError from '../../src/errors/AppError.js';

let mongoServer;

describe('UserSettings Service - Unit Tests', () => {
  beforeEach(async () => {
    if (!mongoServer) {
      mongoServer = await MongoMemoryServer.create();
    }
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(mongoServer.getUri());
    } else {
      await UserSettings.deleteMany({});
    }
  });

  it('creates default settings when none exist', async () => {
    const userId = new mongoose.Types.ObjectId();
    const settings = await getOrCreateUserSettings(userId, 'B2B_CUSTOMER');

    expect(settings.notifications.email).toBe(true);
    expect(settings.preferences.theme).toBe('light');
  });

  it('updates nested notification and preference fields', async () => {
    const userId = new mongoose.Types.ObjectId();
    await getOrCreateUserSettings(userId, 'B2B_CUSTOMER');

    const updated = await updateUserSettings(userId, 'B2B_CUSTOMER', {
      notifications: { email: false },
      preferences: { theme: 'dark' },
    });

    expect(updated.notifications.email).toBe(false);
    expect(updated.preferences.theme).toBe('dark');
  });

  it('throws when update payload has no valid fields', async () => {
    const userId = new mongoose.Types.ObjectId();

    await expect(updateUserSettings(userId, 'B2B_CUSTOMER', {})).rejects.toBeInstanceOf(AppError);
  });
});
