import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { Queue, Worker } from 'bullmq';
import { cleanupQueuesAndWorkers } from '../helpers/testUtils.js';

const connection = {
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT, 10) || 6379,
};

describe('BullMQ (requires real Redis)', () => {
  let testQueue;
  let testWorker;

  beforeEach(() => {
    testQueue = new Queue(`infra-test-${Date.now()}`, { connection });
  });

  afterEach(async () => {
    await cleanupQueuesAndWorkers({
      workers: [testWorker].filter(Boolean),
      queues: [testQueue].filter(Boolean),
      obliterate: true,
      timeout: 5000,
    });
    testWorker = null;
    testQueue = null;
  });

  it('should create queue successfully', () => {
    expect(testQueue).toBeDefined();
    expect(testQueue.name).toContain('infra-test-');
  });

  it('should add job to queue', async () => {
    const job = await testQueue.add('test-job', { data: 'test' });
    expect(job.id).toBeDefined();
    expect(job.data).toEqual({ data: 'test' });
  });

  it('should process job with worker', async () => {
    let processed = false;
    testWorker = new Worker(
      testQueue.name,
      async () => {
        processed = true;
        return { success: true };
      },
      { connection }
    );

    await testQueue.add('process-test', { test: true });
    await new Promise((resolve) => setTimeout(resolve, 2000));
    expect(processed).toBe(true);
  }, 10000);
});
