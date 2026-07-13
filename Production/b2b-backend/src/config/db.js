import dns from 'dns';
import mongoose from 'mongoose';
import { logger } from './logger.js';
import { resolveMongoUri, maskMongoUri } from './env.js';
import { getAppDatabaseName, isDatabaseAllowed, getAllowedDatabases, getNodeEnv } from './environmentResolver.js';
import { getDatabaseConnectionState } from '../utils/databaseHealth.js';
import { APPLICATION_DATABASE_NAME } from '../utils/destructiveGuard.js';
import { bootstrapSuperAdmin } from '../bootstrap/superAdminBootstrap.js';

// Helps MongoDB Atlas connections on Windows when IPv6/SRV resolution is flaky
dns.setDefaultResultOrder('ipv4first');

let isConnected = false;
let isReplicaSet = false;
let memoryServer = null;
let activeDatabaseName = null;

async function resolveInMemoryUri() {
  const { MongoMemoryServer } = await import('mongodb-memory-server');
  memoryServer = await MongoMemoryServer.create();
  const uri = memoryServer.getUri('b2b-ecommerce');
  logger.warn('Using in-memory MongoDB for development (USE_IN_MEMORY_MONGO=true)');
  return uri;
}

export async function validateDatabaseAtStartup() {
  if (mongoose.connection.readyState !== 1) {
    throw new Error('MongoDB connection is not ready');
  }

  await mongoose.connection.db.admin().ping();

  const dbName = mongoose.connection.name;
  activeDatabaseName = dbName;
  const expectedDatabase = getAppDatabaseName();
  const usingInMemory = process.env.USE_IN_MEMORY_MONGO === 'true';
  const isTestRuntime = process.env.NODE_ENV === 'test';
  // Use centralized policy to determine allowed DBs for this NODE_ENV
  const nodeEnv = getNodeEnv();
  if (!usingInMemory && !isTestRuntime && !isDatabaseAllowed(nodeEnv, dbName)) {
    throw new Error(
      `Connected to wrong database "${dbName}". Allowed databases for NODE_ENV="${nodeEnv}" are: ${JSON.stringify(getAllowedDatabases(nodeEnv))}.`
    );
  }

  const collections = await mongoose.connection.db.listCollections({}, { nameOnly: true }).toArray();
  const collectionNames = collections.map((entry) => entry.name);
  const hasUsersCollection = collectionNames.includes('users');

  if (!hasUsersCollection) {
    logger.warn(
      `Database "${dbName}" has no "users" collection yet. Create users via registration or admin workflows.`
    );
  }

  logger.info('✓ Mongo Connected');
  logger.info(`✓ Database: ${dbName}`);
  logger.info(`✓ Collections Found: ${collectionNames.length}`);
  logger.info(`✓ Environment: ${process.env.NODE_ENV || 'development'}`);
  logger.info(`✓ Mongo URI source: ${resolveMongoUri().source || 'in-memory'}`);
  logger.info(`✓ Users collection: ${collectionNames.includes('users') ? 'present' : 'missing'}`);

  return {
    databaseName: dbName,
    collections: collectionNames.length,
    hasUsersCollection,
  };
}

const connectDB = async () => {
  if (isConnected && mongoose.connection.readyState === 1) {
    logger.info('Using existing MongoDB connection');
    return mongoose.connection;
  }

  const mongoConfig = resolveMongoUri();
  const mongoUri = mongoConfig.uri || (process.env.USE_IN_MEMORY_MONGO === 'true'
    ? await resolveInMemoryUri()
    : null);

  if (!mongoUri) {
    logger.error('❌ Missing MONGO_URI');
    process.exit(1);
  }

  logger.info(`Connecting to MongoDB (${mongoConfig.source || 'in-memory'}) → ${maskMongoUri(mongoUri)}`);

  try {
    const conn = await mongoose.connect(mongoUri, {
      maxPoolSize: 10,
      minPoolSize: 2,
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 45000,
      family: 4,
    });

    isConnected = true;
    activeDatabaseName = conn.connection.name;
    logger.info(`MongoDB Connected: ${conn.connection.host}`);

    // Additional runtime safety: patch the concrete db handle to block drops in production
    try {
      if (conn && conn.connection && conn.connection.db) {
        const db = conn.connection.db;
        if (typeof db.dropDatabase === 'function') {
          const origDropDatabase = db.dropDatabase.bind(db);
          db.dropDatabase = async function patchedDropDatabase(...args) {
            if (process.env.NODE_ENV === 'production') {
              throw new Error('Blocked dropDatabase() in production');
            }
            return origDropDatabase(...args);
          };
        }

        const origCollectionFn = db.collection.bind(db);
        db.collection = function patchedCollection(name, ...rest) {
          const coll = origCollectionFn(name, ...rest);
          if (coll && typeof coll.drop === 'function') {
            const origDrop = coll.drop.bind(coll);
            coll.drop = function patchedCollDrop(...args) {
              if (process.env.NODE_ENV === 'production') {
                throw new Error(`Blocked collection.drop(${name}) in production`);
              }
              return origDrop(...args);
            };
          }
          return coll;
        };
      }
    } catch (err) {
      logger.warn('Failed to apply concrete DB drop guards', { error: err.message });
    }

    try {
      const status = await mongoose.connection.db.admin().serverStatus();
      isReplicaSet = !!status.repl;
    } catch (err) {
      logger.warn('Could not detect replica set status, defaulting to standalone mode');
      isReplicaSet = false;
    }

    if (isReplicaSet) {
      logger.info('MongoDB Transaction support enabled (Replica Set detected)');
    } else {
      logger.warn('MongoDB Transactions disabled (Standalone mode detected)');
    }

    await validateDatabaseAtStartup();
    // Apply mongoose safety patches to prevent mass-deletion/drop in production
    try {
      const { applyMongoSafetyPatches } = await import('../utils/mongoSafetyPatch.js');
      applyMongoSafetyPatches({ logger });
    } catch (err) {
      logger.warn('Failed to apply Mongo safety patches', { error: err.message });
    }

    await bootstrapSuperAdmin();
    return conn;
  } catch (error) {
    logger.error('❌ MongoDB connection failed', error);

    if (error.message?.includes('querySrv ECONNREFUSED')) {
      logger.error(
        'DNS SRV lookup failed for mongodb+srv://. Use Atlas standard connection string in MONGO_URI_DIRECT, then restart.'
      );
    }

    if (
      process.env.NODE_ENV !== 'production' &&
      process.env.USE_IN_MEMORY_MONGO !== 'true'
    ) {
      logger.error(
        'Local MongoDB is not running. Install MongoDB, start mongod, or set USE_IN_MEMORY_MONGO=true in .env for development.'
      );
    }

    process.exit(1);
  }
};

mongoose.connection.on('connected', () => {
  isConnected = true;
  activeDatabaseName = mongoose.connection.name;
  logger.info('MongoDB connection established successfully');
});

mongoose.connection.on('disconnected', () => {
  isConnected = false;
  logger.warn('MongoDB disconnected. Authentication and data routes are unavailable until reconnected.');
});

mongoose.connection.on('error', (err) => {
  isConnected = false;
  logger.error(`MongoDB connection error: ${err.message}`);
});

export function getActiveDatabaseName() {
  return activeDatabaseName || mongoose.connection.name || null;
}

export function getMongoDiagnostics() {
  return {
    ...getDatabaseConnectionState(),
    activeDatabaseName: getActiveDatabaseName(),
    isConnectedFlag: isConnected,
  };
}

export const getTransactionSupport = () => isReplicaSet;

export default connectDB;
