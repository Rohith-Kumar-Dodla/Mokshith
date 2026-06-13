import dotenv from 'dotenv';

dotenv.config();

export const env = {
  PORT: process.env.PORT || 5000,
  MONGO_URI: process.env.MONGO_URI,
  JWT_SECRET: process.env.JWT_SECRET,
  JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET,

  FRONTEND_URL: process.env.FRONTEND_URL,

  REDIS_URL: process.env.REDIS_URL,
  REDIS_HOST: process.env.REDIS_HOST || '127.0.0.1',
  REDIS_PORT: Number(process.env.REDIS_PORT || 6379),
  REDIS_PASSWORD: process.env.REDIS_PASSWORD,
  REDIS_SENTINELS: process.env.REDIS_SENTINELS,
  REDIS_SENTINEL_NAME: process.env.REDIS_SENTINEL_NAME,
  REDIS_CLUSTER: process.env.REDIS_CLUSTER,

  NODE_ENV: process.env.NODE_ENV || 'development',
  ENABLE_QUEUE: process.env.ENABLE_QUEUE,
  ENABLE_WORKERS: process.env.ENABLE_WORKERS,

  RAZORPAY_KEY_ID: process.env.RAZORPAY_KEY_ID,
  RAZORPAY_KEY_SECRET: process.env.RAZORPAY_KEY_SECRET,
  RAZORPAY_WEBHOOK_SECRET: process.env.RAZORPAY_WEBHOOK_SECRET,
  razorpay: {
    keyId: process.env.RAZORPAY_KEY_ID,
    keySecret: process.env.RAZORPAY_KEY_SECRET,
    webhookSecret: process.env.RAZORPAY_WEBHOOK_SECRET,
  },
};

export function isRedisRequired() {
  return env.ENABLE_QUEUE === 'true' || env.ENABLE_WORKERS === 'true';
}
