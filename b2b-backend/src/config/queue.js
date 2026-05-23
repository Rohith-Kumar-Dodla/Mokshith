// 🔥 Enable real queue based on environment variable
const USE_REAL_QUEUE = process.env.ENABLE_QUEUE === 'true' || process.env.NODE_ENV === 'production';

import { logger } from './logger.js';

let Queue;
let connection;

if (USE_REAL_QUEUE) {
  try {
    const bullmq = await import('bullmq');
    const { redisClient } = await import('./redis.js');
    
    Queue = bullmq.Queue;
    // BullMQ expects Redis client options, not the client itself
    connection = {
      host: process.env.REDIS_HOST || '127.0.0.1',
      port: parseInt(process.env.REDIS_PORT || '6379'),
      maxRetriesPerRequest: null, // Required for BullMQ
    };
    
    logger.info('BullMQ enabled with Redis connection', { host: connection.host, port: connection.port });
  } catch (error) {
    logger.error('Failed to initialize BullMQ', { error: error.message, stack: error.stack });
    logger.warn('Falling back to mock queue');
  }
}

export const createQueue = (name) => {
  // 🔥 DEV MODE or if BullMQ failed to load
  if (!USE_REAL_QUEUE || !Queue) {
    logger.info('Creating mock queue', { name, mode: 'development' });
    return {
      name,
      add: async (jobName, data, opts) => {
        logger.debug('Mock queue job added', { queue: name, jobName, data, opts });
        return { id: `mock-${Date.now()}`, name: jobName, data };
      },
      close: async () => {},
    };
  }

  // 🚀 PRODUCTION MODE with real BullMQ
  try {
    return new Queue(name, { connection });
  } catch (error) {
    logger.error('Failed to create queue', { name, error: error.message, stack: error.stack });
    // Fallback to mock if queue creation fails
    return {
      name,
      add: async (jobName, data, opts) => {
        logger.debug('Fallback mock queue job added', { queue: name, jobName, data });
        return { id: `fallback-${Date.now()}`, name: jobName, data };
      },
      close: async () => {},
    };
  }
};