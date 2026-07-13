import mongoose from 'mongoose';

async function safeConnect(uri) {
  const conn = await mongoose.createConnection(uri, {
    maxPoolSize: 5,
    minPoolSize: 1,
    serverSelectionTimeoutMS: 5000,
    socketTimeoutMS: 45000,
    family: 4,
  });
  return conn;
}

export async function inspectDatabase(uri) {
  if (!uri) throw new Error('inspectDatabase requires a MongoDB URI');
  const conn = await safeConnect(uri);
  try {
    const db = conn.db;
    const dbName = db.databaseName || conn.name || null;
    const collections = await db.listCollections({}, { nameOnly: true }).toArray();
    const results = [];
    let totalDocuments = 0;
    for (const col of collections) {
      const name = col.name;
      const collection = db.collection(name);
      let count = 0;
      try {
        count = await collection.countDocuments({});
      } catch (err) {
        // fallback
        try {
          count = await collection.estimatedDocumentCount();
        } catch {
          count = -1;
        }
      }
      totalDocuments += count > 0 ? count : 0;
      let indexes = [];
      try {
        indexes = await collection.indexes();
      } catch {
        indexes = [];
      }
      results.push({
        name,
        count,
        indexes,
      });
    }
    return {
      uri,
      dbName,
      collections: results,
      totalCollections: results.length,
      totalDocuments,
    };
  } finally {
    try {
      await conn.close(false);
    } catch {}
  }
}

export default { inspectDatabase };

