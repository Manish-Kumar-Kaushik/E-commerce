import mongoose from 'mongoose';
import logger from '../utils/logger.js';

const DB_STATES = {
  0: 'disconnected',
  1: 'connected',
  2: 'connecting',
  3: 'disconnecting',
};

const shouldRequireDatabase = process.env.REQUIRE_DB === 'true';
const explicitDbName = process.env.DB_NAME?.trim();

mongoose.set('strictQuery', true);
mongoose.set('bufferCommands', false);

export const getDatabaseStatus = () => DB_STATES[mongoose.connection.readyState] || 'unknown';

const connectDB = async () => {
  if (!process.env.MONGO_URI) {
    logger.warn('MONGO_URI is missing. Database connection skipped.');
    return false;
  }

  try {
    const connection = await mongoose.connect(process.env.MONGO_URI, {
      serverSelectionTimeoutMS: 5000,
      ...(explicitDbName ? { dbName: explicitDbName } : {}),
    });

    logger.info(`MongoDB connected on ${connection.connection.host}/${connection.connection.name}`);
    return true;
  } catch (error) {
    logger.error(`MongoDB connection failed: ${error.message}`);

    if (shouldRequireDatabase) {
      logger.error('Database is required for startup because REQUIRE_DB=true.');
      throw error;
    }

    logger.warn('Continuing without MongoDB. Local fallback store will be used.');
    return false;
  }
};

export default connectDB;
