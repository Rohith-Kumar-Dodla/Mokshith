import mongoose from 'mongoose';
import { beforeEach, describe, expect, it } from '@jest/globals';
import { clearDatabase } from '../helpers/testUtils.js';
import Notification from '../../src/modules/notification/notification.model.js';
import { seedActiveUser } from '../helpers/integrationFixtures.js';
import { seedSuperAdminUser } from '../helpers/integrationFixtures.js';
import { publishSuperAdminEvent } from '../../src/modules/notification/businessNotification.service.js';

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

  it('resolves every active Super Admin, excludes other roles and deduplicates retries', async () => {
    const first = await seedSuperAdminUser({ email: 'super-one@test.com' });
    const second = await seedSuperAdminUser({ email: 'super-two@test.com' });
    const customer = await seedActiveUser({ email: 'customer@test.com' });
    const entityId = new mongoose.Types.ObjectId();
    const event = { entityType: 'ORDER', entityId, businessKey: 'created-v1', message: `Order #${entityId} was created.` };

    await publishSuperAdminEvent('ORDER_CREATED', event);
    await publishSuperAdminEvent('ORDER_CREATED', event);

    expect(await Notification.countDocuments({ userId: first.user._id, eventType: 'ORDER_CREATED' })).toBe(1);
    expect(await Notification.countDocuments({ userId: second.user._id, eventType: 'ORDER_CREATED' })).toBe(1);
    expect(await Notification.countDocuments({ userId: customer.user._id })).toBe(0);
    const stored = await Notification.findOne({ userId: first.user._id });
    expect(stored.entityId.toString()).toBe(entityId.toString());
    expect(stored.actionUrl).toBe('/super-admin/orders');
  });
});
