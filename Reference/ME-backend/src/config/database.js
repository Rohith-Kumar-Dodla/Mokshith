import mongoose from 'mongoose';
import logger from '../utils/logger.js';

const connectDatabase = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI);

    logger.info(`MongoDB Connected: ${conn.connection.host}`);
    return conn;
  } catch (error) {
    logger.error(`MongoDB Connection Error: ${error.message}`);
    throw error;
  }
};

const disconnectDatabase = async () => {
  try {
    await mongoose.connection.close();
    logger.info('MongoDB Connection Closed');
  } catch (error) {
    logger.error(`MongoDB Disconnection Error: ${error.message}`);
  }
};

export { connectDatabase, disconnectDatabase };
