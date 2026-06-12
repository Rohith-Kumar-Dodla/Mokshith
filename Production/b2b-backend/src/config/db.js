import dns from 'dns';
import mongoose from 'mongoose';
import { logger } from './logger.js';

// Helps MongoDB Atlas connections on Windows when IPv6/SRV resolution is flaky
dns.setDefaultResultOrder('ipv4first');

let isConnected = false;
let isReplicaSet = false;

const connectDB = async () => {
  if (isConnected) {
    logger.info('Using existing MongoDB connection');
    return;
  }

  const mongoUri = process.env.MONGO_URI_DIRECT || process.env.MONGO_URI;

  if (!mongoUri) {
    logger.error('❌ MONGO_URI is not set in .env');
    process.exit(1);
  }

  try {
    const conn = await mongoose.connect(mongoUri, {
      maxPoolSize: 10,
      minPoolSize: 2,
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 45000,
      family: 4,
    });

    isConnected = true;
    logger.info(`✅ MongoDB Connected: ${conn.connection.host}`);

    // Check if connected to a replica set
    try {
      const status = await mongoose.connection.db.admin().serverStatus();
      isReplicaSet = !!status.repl;
    } catch (err) {
      logger.warn('Could not detect replica set status, defaulting to standalone mode');
      isReplicaSet = false;
    }

    if (isReplicaSet) {
      logger.info('🔄 MongoDB Transaction support enabled (Replica Set detected)');
    } else {
      logger.warn('⚠️ MongoDB Transactions disabled (Standalone mode detected)');
    }
  } catch (error) {
    logger.error('❌ MongoDB connection failed', error);

    if (error.message?.includes('querySrv ECONNREFUSED')) {
      logger.error(
        'DNS SRV lookup failed for mongodb+srv://. Fix: In MongoDB Atlas → Connect → Drivers, copy the STANDARD connection string (starts with mongodb://, not mongodb+srv://), set it as MONGO_URI_DIRECT in .env, then restart the server.'
      );
    }

    process.exit(1);
  }
};

mongoose.connection.on("connected", () => {
  logger.info("MongoDB connection established successfully");
});

mongoose.connection.on("disconnected", () => {
  isConnected = false;
  logger.warn("MongoDB disconnected. Reconnecting...");
});

mongoose.connection.on("error", (err) => {
  logger.error(`MongoDB connection error: ${err}`);
});

export const getTransactionSupport = () => isReplicaSet;

export default connectDB;