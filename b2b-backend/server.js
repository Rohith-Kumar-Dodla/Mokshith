import dotenv from 'dotenv';
dotenv.config();

import app from './src/app.js';
import connectDB from './src/config/db.js';
import { logger } from './src/config/logger.js';
import { Server } from 'socket.io';
import http from 'http';

// 🔥 VALIDATE REQUIRED ENVIRONMENT VARIABLES
const requiredEnvVars = [
  'MONGO_URI',
  'JWT_SECRET',
  'RAZORPAY_KEY_ID',
  'RAZORPAY_KEY_SECRET'
];

const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);

if (missingVars.length > 0) {
  logger.error(`❌ Missing required environment variables: ${missingVars.join(', ')}`);
  logger.error('Please check your .env file and ensure all required variables are set.');
  process.exit(1);
}

// Validate JWT_SECRET strength (minimum 32 characters recommended)
if (process.env.JWT_SECRET && process.env.JWT_SECRET.length < 32) {
  logger.warn('⚠️ JWT_SECRET should be at least 32 characters for production security');
}

const PORT = process.env.PORT || 5000;

let server;
let io;

const startServer = async () => {
  try {
    // 🔥 Connect DB
    await connectDB();

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
      logger.info('✅ Socket.io initialized');
    }

    // Store io globally and in app locals
    global.io = io;
    app.set('io', io);

    io.on('connection', (socket) => {
      logger.info(`🔌 New socket connection: ${socket.id}`);

      // 🔥 Join personal room for targeted events
      socket.on('join', (userId) => {
        if (userId) {
          socket.join(userId);
          logger.info(`👤 User ${userId} joined room ${userId}`);
        }
      });

      socket.on('disconnect', () => {
        logger.info(`🔌 Socket disconnected: ${socket.id}`);
      });
    });

    // 🚀 Start server
    server = httpServer.listen(PORT, '0.0.0.0', () => {
      logger.info(`🚀 Server running on http://localhost:${PORT}`);
    });

    // 🔥 Handle server errors
    server.on('error', (err) => {
      logger.error('Server error:', err);
    });

  } catch (error) {
    logger.error('❌ Server startup failed:', error);
    process.exit(1);
  }
};

// 🔥 Graceful shutdown
const shutdown = async (signal) => {
  logger.info(`⚠️ ${signal} received. Shutting down gracefully...`);

  try {
    if (server) {
      server.close(() => {
        logger.info('💤 Server closed');
        process.exit(0);
      });
    }
  } catch (err) {
    logger.error('Shutdown error:', err);
    process.exit(1);
  }
};

// 🔥 Handle system signals
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

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