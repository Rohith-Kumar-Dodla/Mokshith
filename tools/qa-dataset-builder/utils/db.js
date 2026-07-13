import mongoose from 'mongoose';

let conn = null;

export async function connect(mongoUri, { logger } = {}) {
  if (!mongoUri) throw new Error('MONGO_URI is required to connect');
  if (conn && conn.connection && conn.connection.readyState === 1) {
    return conn;
  }
  conn = await mongoose.createConnection(mongoUri, {
    maxPoolSize: 5,
    minPoolSize: 1,
    serverSelectionTimeoutMS: 10000,
    socketTimeoutMS: 45000,
    family: 4,
  });
  logger?.info('Connected builder mongoose to target DB');
  return conn;
}

export async function disconnect() {
  if (conn) {
    try {
      await conn.close(false);
    } catch {}
    conn = null;
  }
}

export default { connect, disconnect };

