import mongoose from 'mongoose';
import AppError from '../errors/AppError.js';

export const MONGO_READY_STATE = {
  0: 'disconnected',
  1: 'connected',
  2: 'connecting',
  3: 'disconnecting',
};

export function isDatabaseConnected() {
  return mongoose.connection.readyState === 1;
}

export function getDatabaseConnectionState() {
  return {
    readyState: mongoose.connection.readyState,
    status: MONGO_READY_STATE[mongoose.connection.readyState] || 'unknown',
    name: mongoose.connection.name || null,
    host: mongoose.connection.host || null,
  };
}

export function isDatabaseConnectionError(error) {
  if (!error) return false;

  const connectionErrorNames = new Set([
    'MongoNetworkError',
    'MongoServerSelectionError',
    'MongoNotConnectedError',
    'MongoExpiredSessionError',
  ]);

  if (connectionErrorNames.has(error.name)) {
    return true;
  }

  const message = String(error.message || '');
  return (
    message.includes('Client must be connected') ||
    message.includes('Topology is closed') ||
    message.includes('connection closed') ||
    message.includes('not connected')
  );
}

export async function assertDatabaseReady() {
  if (!isDatabaseConnected()) {
    throw new AppError('Database temporarily unavailable', 503);
  }

  try {
    await mongoose.connection.db.admin().ping();
  } catch (error) {
    if (isDatabaseConnectionError(error)) {
      throw new AppError('Database temporarily unavailable', 503);
    }
    throw error;
  }
}

export default {
  isDatabaseConnected,
  getDatabaseConnectionState,
  isDatabaseConnectionError,
  assertDatabaseReady,
};
