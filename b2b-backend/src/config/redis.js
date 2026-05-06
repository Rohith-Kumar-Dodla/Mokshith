import Redis from 'ioredis';
import { env } from './env.js';

const redis = new Redis({
  host: env.REDIS_HOST,
  port: env.REDIS_PORT,
  maxRetriesPerRequest: 1, 
  enableReadyCheck: false,
  lazyConnect: true,
  showFriendlyErrorStack: false, // ⚡ Hide stack trace for connection errors
  retryStrategy(times) {
    if (times > 1) { // ⚡ Only retry once to fail fast in development
      return null; 
    }
    return 1000;
  },
});

redis.on('connect', () => console.log('✅ Redis connected'));
redis.on('error', (err) => {
  if (err.code === 'ECONNREFUSED') {
    // 🔥 Silently handle connection refusal for local development
    // This prevents the server from crashing or spamming errors
    return;
  }
  console.error('❌ Redis error:', err.message);
});

export default redis;