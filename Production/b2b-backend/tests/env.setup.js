/**
 * Runs before test files are imported — ensures env flags apply before app modules load.
 * Keeps tests isolated from local .env (Atlas, Upstash, production secrets).
 */
process.env.NODE_ENV = 'test';
process.env.ENABLE_QUEUE = 'false';
process.env.ENABLE_WORKERS = 'false';
process.env.ENABLE_CRON = 'false';
process.env.ENABLE_FILE_LOGGING = 'false';
process.env.USE_IN_MEMORY_MONGO = 'false';
process.env.AUTH_STRICT_MODE = 'false';
process.env.APP_DATABASE_NAME = 'test';

// Prevent accidental use of developer/production infrastructure during tests
delete process.env.MONGO_URI;
delete process.env.MONGO_URI_DIRECT;
delete process.env.REDIS_URL;
process.env.REDIS_HOST = '127.0.0.1';
process.env.REDIS_PORT = '6379';
delete process.env.REDIS_PASSWORD;

process.env.JWT_SECRET =
  process.env.JWT_SECRET ||
  'test_jwt_secret_key_for_testing_with_minimum_64_characters_required';
process.env.JWT_REFRESH_SECRET =
  process.env.JWT_REFRESH_SECRET ||
  'test_refresh_secret_key_for_testing_minimum_64_chars_long_string';
process.env.RAZORPAY_KEY_ID = process.env.RAZORPAY_KEY_ID || 'test_razorpay_key';
process.env.RAZORPAY_KEY_SECRET = process.env.RAZORPAY_KEY_SECRET || 'test_razorpay_secret';
process.env.RAZORPAY_WEBHOOK_SECRET =
  process.env.RAZORPAY_WEBHOOK_SECRET || 'test_webhook_secret';
