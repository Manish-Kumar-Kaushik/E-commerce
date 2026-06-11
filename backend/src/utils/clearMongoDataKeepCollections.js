import dotenv from 'dotenv';
import mongoose from 'mongoose';
import connectDB from '../config/db.js';
import logger from './logger.js';

dotenv.config();

const clearMongoDataKeepCollections = async () => {
  try {
    const connected = await connectDB();

    if (!connected || mongoose.connection.readyState !== 1) {
      throw new Error('MongoDB is not connected. Set MONGO_URI and run again.');
    }

    const db = mongoose.connection.db;
    const collections = await db.listCollections({}, { nameOnly: true }).toArray();

    let totalDeleted = 0;
    const summary = [];

    for (const { name } of collections) {
      if (!name || name.startsWith('system.')) {
        continue;
      }

      const result = await db.collection(name).deleteMany({});
      const deleted = result?.deletedCount || 0;
      totalDeleted += deleted;
      summary.push({ collection: name, deleted });
    }

    logger.info('MongoDB data cleared (collections kept intact)', {
      collectionsProcessed: summary.length,
      totalDeleted,
      summary,
    });

    process.exit(0);
  } catch (error) {
    logger.error(`Mongo clear failed: ${error.message}`);
    process.exit(1);
  }
};

clearMongoDataKeepCollections();
