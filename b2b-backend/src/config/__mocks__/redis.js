import Redis from 'ioredis-mock';

// Create a mock Redis instance for testing
export const redisClient = new Redis();

// Export default for compatibility
export default {
  redisClient
};
