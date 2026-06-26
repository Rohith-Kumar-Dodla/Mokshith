import mongoose from 'mongoose';
import { clearDatabase } from '../helpers/testUtils.js';
import Notification from '../../src/modules/notification/notification.model.js';
import { seedActiveUser } from '../helpers/integrationFixtures.js';

describe('Notification persistence (queue disabled in test env)', () => {
  beforeEach(async () => {
    await clearDatabase();
  });

  it('persists notification records for downstream worker processing', async () => {
    const { user } = await seedActiveUser();

    await Notification.create({
      userId: user._id,
      title: 'Test',
      message: 'Hello',
      type: 'SYSTEM',
      isRead: false,
    });

    const stored = await Notification.findOne({ userId: user._id });
    expect(stored).toBeDefined();
    expect(stored.title).toBe('Test');
    expect(stored.message).toBe('Hello');
    expect(stored.isRead).toBe(false);
  });
});
