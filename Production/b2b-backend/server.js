import { loadEnv } from './src/config/loadEnv.js';

loadEnv();

import app from './src/app.js';
import connectDB from './src/config/db.js';
import { logger } from './src/config/logger.js';
import { validateEnv } from './src/config/env.js';
import { initializeSentry } from './src/config/sentry.js';
import { redisClient } from './src/config/redis.js';
import { configureSocketAdapter, cleanupSocketAdapter } from './src/config/socketAdapter.js';
import { setupQueryTimeout } from './src/utils/queryTimeout.js';
import { Server } from 'socket.io';
import http from 'http';
import mongoose from 'mongoose';

validateEnv({ logger });

initializeSentry(app);
setupQueryTimeout();
const PORT = process.env.PORT || 5000;

let server;
let io;

const startServer = async () => {
  try {
    // 🔥 Connect DB
    await connectDB();

    // 🔥 Connect Redis (must be before workers/socket adapters)
    logger.info('Connecting to Redis...');
    // Startup trace for payment redis fixes
    logger.info(`PAYMENT_REDIS_FIX_VERSION=${process.env.PAYMENT_REDIS_FIX_VERSION || 'unset'}`);
    const redisConnected = await redisClient.connect();
    if (!redisConnected) {
      logger.warn('Redis connection failed - some features may be limited');
    }

    // Create HTTP server
    const httpServer = http.createServer(app);

    // Initialize Socket.io with production-ready configuration
    io = new Server(httpServer, {
      cors: {
        origin: process.env.NODE_ENV === 'production' 
          ? process.env.FRONTEND_URL || "https://mokshith-entreprises.vercel.app"
          : "*",
        methods: ["GET", "POST", "PATCH"],
        credentials: true
      },
      transports: ['websocket', 'polling'], // Allow polling fallback for stability
      pingTimeout: 60000, // 60 seconds before considering connection dead
      pingInterval: 25000, // Ping every 25 seconds
      connectTimeout: 45000, // Connection timeout
      maxHttpBufferSize: 1e6, // 1MB max message size
      allowUpgrades: true, // Allow transport upgrades
      perMessageDeflate: false, // Disable compression for better performance
      httpCompression: false // Disable http compression (app-level compression is better)
    });

    // Verify IO initialization
    if (io) {
      logger.info('Socket.io initialized');
    }

    // Configure Redis adapter for horizontal scaling (only if Redis connected)
    if (redisConnected) {
      await configureSocketAdapter(io);
      // Store io globally and in app locals
      global.io = io;
      app.set('io', io);
    } else {
      logger.warn('Redis not connected - skipping Socket.IO adapter configuration and global io registration');
      // Still store io in app locals for compatibility, but avoid Redis adapter usage
      app.set('io', io);
      global.io = io;
    }
    

    io.on('connection', (socket) => {
      logger.info(`New socket connection: ${socket.id}`);

      // 🔥 Join personal room for targeted events
      socket.on('join', (userId) => {
        if (userId) {
          socket.join(userId);
          logger.info(`👤 User ${userId} joined room ${userId}`);
        }
      });

      socket.on('disconnect', () => {
        logger.info(`Socket disconnected: ${socket.id}`);
      });
    });

    // ⏰ Start cron jobs for payment reconciliation
    try {
      // Only start cron jobs if not in test environment
      if (process.env.NODE_ENV !== 'test' && process.env.ENABLE_CRON !== 'false') {
        const { startCronJobs } = await import('./src/jobs/cron.js');
        startCronJobs();
      } else {
        logger.info('Cron jobs disabled in test environment');
      }
    } catch (err) {
      logger.warn('⚠️ Cron jobs not started:', err.message);
    }

    // 🚀 Start BullMQ workers
    try {
      // Safer default: require explicit opt-in to start workers in non-test environments.
      // This prevents unexpected worker storms or remote Redis request spikes in developer machines.
      if (process.env.NODE_ENV !== 'test' && process.env.ENABLE_WORKERS === 'true') {
        const { startWorkers } = await import('./src/workers/index.js');
        startWorkers();
      } else {
        logger.info('Workers not started. Set ENABLE_WORKERS=true to enable background workers.');
      }
    } catch (err) {
      logger.warn('⚠️ Workers not started:', err.message);
    }

    // 🚀 Start server
    server = httpServer.listen(PORT, '0.0.0.0', () => {
      logger.info(`Server running on http://localhost:${PORT}`);
    });

    // 🔥 Handle server errors
    server.on('error', (err) => {
      logger.error('Server error:', err);
    });

  } catch (error) {
    logger.error('Server startup failed:', error);
    process.exit(1);
  }
};

// 🔥 Graceful shutdown
const shutdown = async (signal) => {
  logger.info(`${signal} received. Shutting down gracefully...`);

  try {
    // 1. Stop accepting new connections
    if (server) {
      server.close(() => {
        logger.info('💤 HTTP Server closed');
      });
    }

    // 2. Close Socket.IO connections and Redis adapter
    if (io) {
      await cleanupSocketAdapter(io);
      io.close(() => {
        logger.info('💤 Socket.IO closed');
      });
    }

    // 3. Shutdown BullMQ workers
    try {
      if (process.env.NODE_ENV !== 'test' && 
          process.env.ENABLE_QUEUE !== 'false' && 
          process.env.ENABLE_WORKERS !== 'false') {
        const { shutdownWorkers } = await import('./src/workers/index.js');
        await shutdownWorkers();
      }
    } catch (err) {
      logger.warn('Workers shutdown skipped:', err.message);
    }

    // 4. Close database connection
    try {
      if (mongoose.connection && mongoose.connection.readyState !== 0) {
        await mongoose.connection.close(false);
        logger.info('💤 MongoDB connection closed');
      }
    } catch (dbCloseErr) {
      logger.warn('Failed to close MongoDB connection cleanly', { error: dbCloseErr.message });
    }

    // 5. Close Redis connection
    try {
      await redisClient.quit();
      logger.info('💤 Redis connection closed');
    } catch (err) {
      logger.warn('Redis quit warning:', err.message);
    }

    logger.info('Graceful shutdown completed');
    process.exit(0);
  } catch (err) {
    logger.error('Shutdown error:', err);
    process.exit(1);
  }
};

// 🔥 Handle system signals
process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));

// 🔥 Handle uncaught errors
process.on('uncaughtException', (err) => {
  logger.error('Uncaught Exception:', err);
  process.exit(1);
});

process.on('unhandledRejection', (err) => {
  logger.error('Unhandled Rejection:', err);
  process.exit(1);
});

// 🚀 Start
startServer();