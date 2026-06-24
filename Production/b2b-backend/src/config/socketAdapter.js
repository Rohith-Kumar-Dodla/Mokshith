import { createAdapter } from '@socket.io/redis-adapter';
import redis from './redis.js';
import { logger } from './logger.js';

/**
 * Configure Socket.IO Redis adapter for horizontal scaling
 * Enables multiple server instances to share socket connections
 */
export const configureSocketAdapter = async (io) => {
  // Only use Redis adapter in production or when explicitly enabled
  if (process.env.NODE_ENV !== 'production' && process.env.USE_SOCKET_REDIS_ADAPTER !== 'true') {
    logger.info('Socket.IO using default in-memory adapter (dev mode)');
    return;
  }

  try {
    // Use centralized ioredis client and duplicate for pub/sub
    const pubClient = redis.duplicate();
    const subClient = redis.duplicate();

    // Error handlers
    pubClient.on('error', (err) => logger.error('Socket.IO Redis Pub Client Error:', err));
    subClient.on('error', (err) => logger.error('Socket.IO Redis Sub Client Error:', err));

    // Connect both clients (ioredis duplicate instances need connect)
    await Promise.all([pubClient.connect(), subClient.connect()]);

    // Create and attach adapter
    io.adapter(createAdapter(pubClient, subClient));

    logger.info('✅ Socket.IO Redis adapter configured for horizontal scaling (using centralized redis client)');

    // Store clients for cleanup
    io.socketRedisClients = { pubClient, subClient };
  } catch (error) {
    logger.error('❌ Failed to configure Socket.IO Redis adapter:', error);
    logger.warn('⚠️ Falling back to default in-memory adapter');
  }
};

/**
 * Cleanup Socket.IO Redis adapter connections
 */
export const cleanupSocketAdapter = async (io) => {
  if (io.socketRedisClients) {
    const { pubClient, subClient } = io.socketRedisClients;
    try {
      await Promise.all([
        pubClient.quit(),
        subClient.quit()
      ]);
      logger.info('✅ Socket.IO Redis adapter connections closed');
    } catch (error) {
      logger.error('Error closing Socket.IO Redis adapter:', error);
    }
  }
};
