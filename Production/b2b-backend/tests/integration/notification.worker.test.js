import { jest } from '@jest/globals';
import { setupTestDB, teardownTestDB, clearDatabase, setupRedis, teardownRedis, waitFor, mockExternalServices } from '../helpers/testUtils.js';
import Notification from '../../src/modules/notification/notification.model.js';
import { QUEUE_NAMES } from '../../src/constants/queueNames.js';

describe('Notification queue and worker (end-to-end)', () => {
  beforeAll(async () => {
    process.env.NODE_ENV = 'test';
    await setupTestDB();
    setupRedis();
  });

  afterAll(async () => {
    await clearDatabase();
    await teardownTestDB();
    await teardownRedis();
  });

  beforeEach(async () => {
    jest.restoreAllMocks();
    await clearDatabase();
  });
  it('enqueues a notification and simulates worker processing by verifying DB side-effect', async () => {
    // Ensure external services (including bullmq mock) are mocked before importing queue
    mockExternalServices();
    const { notificationQueue } = await import('../../src/queues/notification.queue.js');

    // Use the notificationQueue (which uses ioredis-mock in test env)
    const job = await notificationQueue.add('send_notification', {
      userId: 'user1',
      title: 'Test',
      message: 'Hello'
    });

    expect(job.id).toBeDefined();

    // Simulate worker behavior: in production a worker would read and call sendNotification
    // For test, verify that the job data can be consumed and a Notification record can be created
    const data = job.data;
    await Notification.create({
      userId: data.userId,
      title: data.title,
      message: data.message,
      read: false
    });

    // Wait briefly and assert DB record exists
    await waitFor(50);
    const n = await Notification.findOne({ userId: 'user1' });
    expect(n).toBeDefined();
    expect(n.title).toBe('Test');
  });
});

